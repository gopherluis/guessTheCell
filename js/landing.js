/* Guess the Cell — landing page controller.
   Owns the option pickers (theme, card back, mode, board size, toggles) and
   renders the persistent learning profile. */
(function (global) {
  "use strict";

  const GTC = global.GTC;
  const data = GTC.data;
  const storage = GTC.storage;
  const fuzzy = GTC.fuzzy;
  const themes = GTC.themes;
  const audio = GTC.audio;

  let profile = storage.loadProfile();

  const cardBackPicker = document.getElementById("cardback-picker");
  const modeList = document.getElementById("mode-list");
  const pairsRange = document.getElementById("pairs-range");
  const pairsValue = document.getElementById("pairs-value");
  const startBtn = document.getElementById("start-btn");
  const resumeBanner = document.getElementById("resume-banner");
  const resumeStart = document.getElementById("resume-start");
  const resumeDiscard = document.getElementById("resume-discard");

  const toggleSound = document.getElementById("opt-sound");
  const toggleMotion = document.getElementById("opt-motion");
  const toggleHints = document.getElementById("opt-hints");
  const toggleTypeIn = document.getElementById("opt-typein");

  const statGames = document.getElementById("stat-games");
  const statBestScore = document.getElementById("stat-best-score");
  const statBestTime = document.getElementById("stat-best-time");
  const statStreak = document.getElementById("stat-streak");
  const statAccuracy = document.getElementById("stat-accuracy");
  const statTotal = document.getElementById("stat-total");

  const masteryList = document.getElementById("mastery-list");
  const trendChart = document.getElementById("trend-chart");
  const profileEmpty = document.getElementById("profile-empty");
  const themeNameEl = document.getElementById("theme-name");
  const themeMenuEl = document.querySelector("[data-theme-menu]");
  let themeMenu = null;
  const resetBtn = document.getElementById("reset-btn");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");

  /* ---- persistence helpers ---- */

  function persist() {
    storage.saveProfile(profile);
    themes.apply(profile.settings.theme);
    themes.applyCardBack(profile.settings.cardBack, data.cardBacks);
    themes.applyMotion(profile.settings.motion !== false);
    audio.setEnabled(profile.settings.sound !== false);
  }

  function setSetting(key, value) {
    profile.settings[key] = value;
    persist();
    renderProfile();
  }

  /* ---- pickers ---- */

  function renderCardBackPicker() {
    cardBackPicker.innerHTML = "";
    Object.keys(data.cardBacks).forEach(function (id) {
      const back = data.cardBacks[id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "back-chip";
      button.setAttribute("data-back-id", id);
      button.title = back.name + " card back";
      button.setAttribute("aria-label", "Use the " + back.name + " card back");
      button.innerHTML = back.svg;
      button.classList.toggle("is-active", id === profile.settings.cardBack);
      button.addEventListener("click", function () {
        setSetting("cardBack", id);
        renderCardBackPicker();
      });
      cardBackPicker.appendChild(button);
    });
  }

  function renderModeList() {
    modeList.innerHTML = "";
    Object.keys(data.modes).forEach(function (id) {
      const mode = data.modes[id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mode-card";
      button.setAttribute("data-mode-id", id);
      button.innerHTML =
        '<span class="mode-name">' + mode.name + "</span>" +
        '<span class="mode-tagline">' + mode.tagline + "</span>" +
        '<span class="mode-meta">' +
        '<span>' + mode.pairs + " pairs</span>" +
        "<span>" + (mode.seconds ? mode.seconds + "s" : "no clock") + "</span>" +
        "<span>+" + mode.basePoints + " base</span>" +
        "</span>";
      button.classList.toggle("is-active", id === profile.settings.mode);
      button.addEventListener("click", function () {
        profile.settings.mode = id;
        profile.settings.pairs = mode.pairs;
        pairsRange.value = String(mode.pairs);
        pairsValue.textContent = mode.pairs + " pairs";
        persist();
        renderModeList();
      });
      modeList.appendChild(button);
    });
  }

  function syncToggles() {
    toggleSound.checked = profile.settings.sound !== false;
    toggleMotion.checked = profile.settings.motion !== false;
    toggleHints.checked = profile.settings.hints !== false;
    toggleTypeIn.checked = profile.settings.typeIn !== false;
  }

  /* ---- learning profile ---- */

  function formatDuration(ms) {
    if (!ms) return "—";
    const total = Math.round(ms / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return minutes + "m " + String(seconds).padStart(2, "0") + "s";
  }

  function renderStats() {
    const stats = profile.stats;
    const accuracy =
      stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;

    statGames.textContent = String(stats.gamesPlayed);
    statBestScore.textContent = stats.bestScore > 0 ? String(stats.bestScore) : "—";
    statBestTime.textContent = formatDuration(stats.bestTimeMs);
    statStreak.textContent = String(stats.bestStreak);
    statAccuracy.textContent = stats.totalQuestions > 0 ? accuracy + "%" : "—";
    statTotal.textContent = String(stats.totalCorrect);

    profileEmpty.classList.toggle("is-hidden", stats.gamesPlayed > 0);
  }

  function renderMastery() {
    const queue = fuzzy.reviewQueue(profile, data.organelles);
    masteryList.innerHTML = "";
    queue.forEach(function (item) {
      const row = document.createElement("li");
      row.className = "mastery-row";
      const dueTag = item.due ? '<span class="tag tag-due">due</span>' : "";
      const pct = Math.round(item.mastery * 100);
      row.innerHTML =
        '<span class="mastery-dot" style="background:' + item.accent + '"></span>' +
        '<span class="mastery-name">' + item.name + "</span>" +
        '<span class="mastery-bar"><span class="mastery-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="mastery-state">' + item.masteryLabel + "</span>" +
        dueTag +
        '<span class="mastery-count">' + item.seen + " seen</span>";
      masteryList.appendChild(row);
    });
  }

  function renderTrend() {
    const sessions = profile.sessions;
    trendChart.innerHTML = "";
    if (sessions.length < 2) {
      trendChart.innerHTML =
        '<p class="chart-empty">Play two runs and your score trend shows up here.</p>';
      return;
    }
    const points = sessions.map(function (s) { return s.score; });
    const max = Math.max.apply(null, points.concat([1]));
    const min = Math.min.apply(null, points.concat([0]));
    const span = Math.max(1, max - min);
    const width = 100;
    const height = 34;
    const step = width / (points.length - 1);
    const coords = points.map(function (value, index) {
      const x = (index * step).toFixed(2);
      const y = (height - ((value - min) / span) * height).toFixed(2);
      return x + "," + y;
    });
    const line = coords.join(" ");
    const area = "0," + height + " " + line + " " + width + "," + height;
    trendChart.innerHTML =
      '<svg viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">' +
      '<polygon class="chart-area" points="' + area + '"></polygon>' +
      '<polyline class="chart-line" points="' + line + '"></polyline>' +
      "</svg>" +
      '<span class="chart-caption">' + points.length + " runs · best " + max + "</span>";
  }

  function renderProfile() {
    renderStats();
    renderMastery();
    renderTrend();
  }

  /* ---- resume banner ---- */

  function renderResume() {
    const run = storage.loadRun();
    if (!run) {
      resumeBanner.classList.add("is-hidden");
      return;
    }
    resumeBanner.classList.remove("is-hidden");
    resumeStart.textContent = "Resume run (" + (run.stats ? run.stats.score : 0) + " pts)";
    resumeStart.onclick = function () {
      window.location.href = "game.html";
    };
    resumeDiscard.onclick = function () {
      storage.clearRun();
      renderResume();
    };
  }

  /* ---- theme settings menu ---- */

  function mountThemeMenu() {
    themeMenu = GTC.themeMenu.mount({
      container: themeMenuEl,
      nameEl: themeNameEl,
      getThemeId: function () {
        return profile.settings.theme;
      },
      setThemeId: function (id) {
        setSetting("theme", id);
      }
    });
    return themeMenu;
  }

  /* ---- data management ---- */

  function resetProgress() {
    const confirmed = window.confirm(
      "Reset all saved progress? Mastery, scores and session history will be deleted."
    );
    if (!confirmed) return;
    profile = storage.resetProfile();
    persist();
    themeMenu.render();
    renderCardBackPicker();
    renderModeList();
    syncToggles();
    renderProfile();
    renderResume();
  }

  function exportProgress() {
    const blob = new Blob([storage.exportProfile(profile)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "guess-the-cell-progress.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importProgress(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        profile = storage.importProfile(reader.result);
        persist();
        themeMenu.render();
        renderCardBackPicker();
        renderModeList();
        syncToggles();
        renderProfile();
      } catch (err) {
        window.alert("That file could not be read as a Guess the Cell profile.");
      }
    };
    reader.readAsText(file);
  }

  /* ---- events ---- */

  pairsRange.addEventListener("input", function () {
    const value = Number(pairsRange.value);
    profile.settings.pairs = value;
    pairsValue.textContent = value + " pairs";
    persist();
  });

  toggleSound.addEventListener("change", function () {
    setSetting("sound", toggleSound.checked);
  });
  toggleMotion.addEventListener("change", function () {
    setSetting("motion", toggleMotion.checked);
  });
  toggleHints.addEventListener("change", function () {
    setSetting("hints", toggleHints.checked);
  });
  toggleTypeIn.addEventListener("change", function () {
    setSetting("typeIn", toggleTypeIn.checked);
  });

  startBtn.addEventListener("click", function () {
    persist();
    window.location.href = "game.html";
  });

  resetBtn.addEventListener("click", resetProgress);
  exportBtn.addEventListener("click", exportProgress);
  importBtn.addEventListener("click", function () { importFile.click(); });
  importFile.addEventListener("change", function () {
    if (importFile.files && importFile.files[0]) importProgress(importFile.files[0]);
    importFile.value = "";
  });

  /* ---- boot ---- */

  function init() {
    themes.apply(profile.settings.theme);
    themes.applyCardBack(profile.settings.cardBack, data.cardBacks);
    themes.applyMotion(profile.settings.motion !== false);
    audio.setEnabled(profile.settings.sound !== false);

    pairsRange.value = String(profile.settings.pairs);
    pairsValue.textContent = profile.settings.pairs + " pairs";

    mountThemeMenu();
    renderCardBackPicker();
    renderModeList();
    syncToggles();
    renderProfile();
    renderResume();
  }

  init();
})(window);
