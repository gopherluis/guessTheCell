/* Guess the Cell — persistent profile storage.
   Everything the player accumulates lives in localStorage under one versioned
   profile key, plus a separate key for an in-progress run so a refresh does
   not throw away a game. */
(function (global) {
  "use strict";

  const PROFILE_KEY = "gtc.profile.v1";
  const RUN_KEY = "gtc.session.v1";
  const SCHEMA_VERSION = 1;
  const MAX_SESSIONS = 30;
  const RECENT_WINDOW = 8;

  const DEFAULT_SETTINGS = {
    theme: "pastel",
    cardBack: "cell",
    mode: "classic",
    pairs: 8,
    sound: true,
    motion: true,
    hints: true,
    typeIn: true
  };

  const DEFAULT_STATS = {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesAbandoned: 0,
    totalScore: 0,
    bestScore: 0,
    bestTimeMs: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedAt: 0
  };

  /* ---- low level store with a safe fallback for private mode ---- */

  let memoryFallback = null;

  function readRaw(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (err) {
      return memoryFallback ? memoryFallback[key] : null;
    }
  }

  function writeRaw(key, value) {
    try {
      global.localStorage.setItem(key, value);
      return true;
    } catch (err) {
      if (!memoryFallback) memoryFallback = {};
      memoryFallback[key] = value;
      return false;
    }
  }

  function removeRaw(key) {
    try {
      global.localStorage.removeItem(key);
    } catch (err) {
      if (memoryFallback) delete memoryFallback[key];
    }
  }

  /* ---- profile helpers ---- */

  function now() {
    return Date.now();
  }

  function blankMastery() {
    return {
      seen: 0,
      correct: 0,
      wrong: 0,
      score: 0,
      recent: [],
      lastSeenAt: 0,
      avgResponseMs: 0,
      totalResponseMs: 0,
      intervalDays: 0,
      dueAt: 0,
      tierCounts: { easy: 0, medium: 0, hard: 0 }
    };
  }

  function freshProfile() {
    return {
      version: SCHEMA_VERSION,
      createdAt: now(),
      updatedAt: now(),
      settings: Object.assign({}, DEFAULT_SETTINGS),
      stats: Object.assign({}, DEFAULT_STATS),
      mastery: {},
      sessions: []
    };
  }

  function normaliseProfile(raw) {
    const profile = freshProfile();
    if (!raw || typeof raw !== "object") return profile;

    if (raw.settings && typeof raw.settings === "object") {
      Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
        if (raw.settings[key] !== undefined && raw.settings[key] !== null) {
          profile.settings[key] = raw.settings[key];
        }
      });
    }

    if (raw.stats && typeof raw.stats === "object") {
      Object.keys(DEFAULT_STATS).forEach(function (key) {
        const value = Number(raw.stats[key]);
        if (isFinite(value)) profile.stats[key] = value;
      });
    }

    if (raw.mastery && typeof raw.mastery === "object") {
      Object.keys(raw.mastery).forEach(function (id) {
        const entry = raw.mastery[id];
        if (!entry || typeof entry !== "object") return;
        const base = blankMastery();
        Object.keys(base).forEach(function (key) {
          if (entry[key] !== undefined && entry[key] !== null) base[key] = entry[key];
        });
        base.seen = Number(base.seen) || 0;
        base.correct = Number(base.correct) || 0;
        base.wrong = Number(base.wrong) || 0;
        base.score = Math.max(0, Math.min(1, Number(base.score) || 0));
        base.recent = Array.isArray(base.recent)
          ? base.recent.filter(function (v) { return v === 0 || v === 1; }).slice(-RECENT_WINDOW)
          : [];
        base.tierCounts = Object.assign({ easy: 0, medium: 0, hard: 0 }, base.tierCounts || {});
        profile.mastery[id] = base;
      });
    }

    if (Array.isArray(raw.sessions)) {
      profile.sessions = raw.sessions
        .filter(function (s) { return s && typeof s === "object"; })
        .slice(-MAX_SESSIONS);
    }

    profile.createdAt = Number(raw.createdAt) || profile.createdAt;
    profile.version = SCHEMA_VERSION;
    return profile;
  }

  function loadProfile() {
    const raw = readRaw(PROFILE_KEY);
    if (!raw) return freshProfile();
    try {
      return normaliseProfile(JSON.parse(raw));
    } catch (err) {
      return freshProfile();
    }
  }

  function saveProfile(profile) {
    profile.updatedAt = now();
    writeRaw(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }

  function resetProfile() {
    removeRaw(PROFILE_KEY);
    removeRaw(RUN_KEY);
    return freshProfile();
  }

  /* ---- mastery bookkeeping ---- */

  function masteryFor(profile, id) {
    if (!profile.mastery[id]) profile.mastery[id] = blankMastery();
    return profile.mastery[id];
  }

  /* Consistency is the inverse of the normalised spread of the recent
     results: answering the same way every time reads as consistent. */
  function computeConsistency(recent) {
    if (!recent || recent.length < 2) return 0.5;
    const mean = recent.reduce(function (sum, v) { return sum + v; }, 0) / recent.length;
    const variance =
      recent.reduce(function (sum, v) { return sum + (v - mean) * (v - mean); }, 0) /
      recent.length;
    const spread = Math.sqrt(variance) / 0.5;
    return Math.max(0, Math.min(1, 1 - spread));
  }

  /* A graded result: right answers are worth less when they were slow,
     wrong answers are worth nothing but still move the record. */
  function gradeResult(correct, responseMs) {
    if (!correct) return 0;
    const ms = Number(responseMs) || 0;
    const speed = ms <= 4000 ? 1 : ms <= 9000 ? 0.85 : 0.7;
    return speed;
  }

  function recordOrganelleResult(profile, id, details) {
    const entry = masteryFor(profile, id);
    const correct = !!details.correct;
    const responseMs = Number(details.responseMs) || 0;
    const tier = details.tier || "medium";

    entry.seen += 1;
    if (correct) entry.correct += 1;
    else entry.wrong += 1;

    const quality = gradeResult(correct, responseMs);
    const alpha = 0.4;
    entry.score = Math.max(0, Math.min(1, entry.score * (1 - alpha) + quality * alpha));

    entry.recent.push(correct ? 1 : 0);
    if (entry.recent.length > RECENT_WINDOW) entry.recent.shift();

    entry.totalResponseMs += responseMs;
    entry.avgResponseMs = Math.round(entry.totalResponseMs / Math.max(1, entry.seen));
    entry.lastSeenAt = now();
    entry.tierCounts[tier] = (entry.tierCounts[tier] || 0) + 1;

    /* Spaced repetition: success pushes the next review further out. */
    if (correct) {
      const factor = 1.6 + 0.8 * entry.score;
      entry.intervalDays = Math.min(30, Math.max(1, Math.round(entry.intervalDays * factor || 1)));
    } else {
      entry.intervalDays = 0;
    }
    entry.dueAt = entry.lastSeenAt + entry.intervalDays * 86400000;

    return entry;
  }

  function recordSession(profile, summary) {
    const stats = profile.stats;
    stats.gamesPlayed += 1;
    stats.totalScore += Number(summary.score) || 0;
    stats.totalCorrect += Number(summary.correct) || 0;
    stats.totalQuestions += Number(summary.questions) || 0;
    stats.totalAttempts += Number(summary.attempts) || 0;
    stats.lastPlayedAt = now();

    if (summary.win) {
      stats.gamesWon += 1;
      stats.currentStreak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      stats.bestScore = Math.max(stats.bestScore, Number(summary.score) || 0);
      if (summary.timeMs > 0) {
        stats.bestTimeMs =
          stats.bestTimeMs === 0 ? summary.timeMs : Math.min(stats.bestTimeMs, summary.timeMs);
      }
    } else {
      stats.currentStreak = 0;
    }

    profile.sessions.push({
      ts: now(),
      mode: summary.mode || "classic",
      score: Number(summary.score) || 0,
      timeMs: Number(summary.timeMs) || 0,
      attempts: Number(summary.attempts) || 0,
      errors: Number(summary.errors) || 0,
      correct: Number(summary.correct) || 0,
      questions: Number(summary.questions) || 0,
      demand: Number(summary.demand) || 0,
      win: !!summary.win
    });
    if (profile.sessions.length > MAX_SESSIONS) {
      profile.sessions = profile.sessions.slice(-MAX_SESSIONS);
    }

    return profile;
  }

  /* ---- in-progress run (survives a refresh) ---- */

  function saveRun(state) {
    writeRaw(RUN_KEY, JSON.stringify({ savedAt: now(), state: state }));
  }

  function loadRun() {
    const raw = readRaw(RUN_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.state) return null;
      /* Runs older than 6 hours are considered abandoned. */
      if (now() - (parsed.savedAt || 0) > 6 * 3600 * 1000) {
        removeRaw(RUN_KEY);
        return null;
      }
      return parsed.state;
    } catch (err) {
      return null;
    }
  }

  function clearRun() {
    removeRaw(RUN_KEY);
  }

  /* ---- import / export ---- */

  function exportProfile(profile) {
    return JSON.stringify(profile, null, 2);
  }

  function importProfile(text) {
    const parsed = JSON.parse(text);
    return saveProfile(normaliseProfile(parsed));
  }

  global.GTC = global.GTC || {};
  global.GTC.storage = {
    PROFILE_KEY: PROFILE_KEY,
    RUN_KEY: RUN_KEY,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    DEFAULT_STATS: DEFAULT_STATS,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    resetProfile: resetProfile,
    freshProfile: freshProfile,
    masteryFor: masteryFor,
    recordOrganelleResult: recordOrganelleResult,
    recordSession: recordSession,
    computeConsistency: computeConsistency,
    saveRun: saveRun,
    loadRun: loadRun,
    clearRun: clearRun,
    exportProfile: exportProfile,
    importProfile: importProfile
  };
})(window);
