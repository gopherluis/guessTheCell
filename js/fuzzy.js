/* Guess the Cell — fuzzy reasoning engine.

   A small Mamdani-style fuzzy inference system. Each organelle is evaluated
   against fuzzy linguistic variables (mastery, consistency, recency, speed),
   a rule base fires, and the defuzzified output decides:
     - demand   : how badly the topic needs reinforcement this session
     - tier     : which question difficulty to ask (warm-up / core / challenge)
     - pressure : how punishing the board should be when the player is wrong

   The engine is pure: it reads a profile and returns a plan. Nothing here
   touches the DOM or localStorage. */
(function (global) {
  "use strict";

  /* ---- primitives ---- */

  function clamp01(value) {
    const n = Number(value);
    if (!isFinite(n)) return 0;
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  /* Trapezoidal membership: 0 outside [a,d], ramp up to 1 across [a,b],
     plateau [b,c], ramp down to 0 across [c,d].
     A degenerate ramp (a === b) means "full membership from a onwards". */
  function trapezoid(x, def) {
    const a = def[0];
    const b = def[1];
    const c = def[2];
    const d = def[3];
    if (x < a || x > d) return 0;
    if (x <= b) return b === a ? 1 : (x - a) / (b - a);
    if (x >= c) return d === c ? 1 : (d - x) / (d - c);
    return 1;
  }

  /* ---- fuzzy variables ---- */

  const VARIABLES = {
    mastery: {
      poor: [0, 0, 0.25, 0.45],
      average: [0.25, 0.45, 0.65, 0.85],
      good: [0.65, 0.85, 1, 1]
    },
    consistency: {
      erratic: [0, 0, 0.3, 0.5],
      steady: [0.3, 0.5, 0.7, 0.9],
      rock: [0.7, 0.9, 1, 1]
    },
    recency: {
      stale: [0, 0, 0.2, 0.4],
      recent: [0.2, 0.4, 0.6, 0.8],
      fresh: [0.6, 0.8, 1, 1]
    },
    speed: {
      sluggish: [0, 0, 0.3, 0.5],
      brisk: [0.3, 0.5, 0.7, 0.9],
      lightning: [0.7, 0.9, 1, 1]
    },
    globalSkill: {
      novice: [0, 0, 0.3, 0.5],
      steady: [0.3, 0.5, 0.7, 0.9],
      expert: [0.7, 0.9, 1, 1]
    }
  };

  const OUTPUTS = {
    demand: {
      gentle: [0, 0, 0.3, 0.5],
      moderate: [0.3, 0.5, 0.7, 0.9],
      intense: [0.7, 0.9, 1, 1]
    },
    tier: {
      easy: [0, 0, 0.3, 0.5],
      medium: [0.3, 0.5, 0.7, 0.9],
      hard: [0.7, 0.9, 1, 1]
    },
    pressure: {
      gentle: [0, 0, 0.3, 0.5],
      moderate: [0.3, 0.5, 0.7, 0.9],
      intense: [0.7, 0.9, 1, 1]
    }
  };

  /* ---- rule bases ---- */

  const DEMAND_RULES = {
    output: { name: "demand", sets: OUTPUTS.demand },
    rules: [
      { if: [{ var: "mastery", set: "poor" }], then: { set: "intense" } },
      { if: [{ var: "mastery", set: "poor" }, { var: "recency", set: "stale" }], then: { set: "intense" } },
      { if: [{ var: "mastery", set: "average" }, { var: "consistency", set: "erratic" }], then: { set: "intense" } },
      { if: [{ var: "mastery", set: "average" }, { var: "consistency", set: "steady" }], then: { set: "moderate" } },
      { if: [{ var: "mastery", set: "average" }, { var: "recency", set: "stale" }], then: { set: "moderate" } },
      { if: [{ var: "mastery", set: "good" }, { var: "consistency", set: "erratic" }], then: { set: "moderate" } },
      { if: [{ var: "mastery", set: "good" }, { var: "consistency", set: "rock" }], then: { set: "gentle" } },
      { if: [{ var: "mastery", set: "good" }, { var: "recency", set: "fresh" }], then: { set: "gentle" } },
      { if: [{ var: "speed", set: "sluggish" }, { var: "mastery", set: "average" }], then: { set: "moderate" } },
      { if: [{ var: "speed", set: "lightning" }, { var: "mastery", set: "good" }], then: { set: "gentle" } }
    ]
  };

  const TIER_RULES = {
    output: { name: "tier", sets: OUTPUTS.tier },
    rules: [
      { if: [{ var: "mastery", set: "poor" }], then: { set: "easy" } },
      { if: [{ var: "mastery", set: "average" }], then: { set: "medium" } },
      { if: [{ var: "mastery", set: "good" }, { var: "globalSkill", set: "expert" }], then: { set: "hard" } },
      { if: [{ var: "mastery", set: "good" }, { var: "globalSkill", set: "steady" }], then: { set: "medium" } },
      { if: [{ var: "mastery", set: "good" }, { var: "globalSkill", set: "novice" }], then: { set: "easy" } },
      { if: [{ var: "consistency", set: "erratic" }, { var: "mastery", set: "average" }], then: { set: "easy" } },
      { if: [{ var: "speed", set: "lightning" }, { var: "mastery", set: "good" }], then: { set: "hard" } }
    ]
  };

  const PRESSURE_RULES = {
    output: { name: "pressure", sets: OUTPUTS.pressure },
    rules: [
      { if: [{ var: "mastery", set: "poor" }], then: { set: "moderate" } },
      { if: [{ var: "consistency", set: "erratic" }], then: { set: "intense" } },
      { if: [{ var: "mastery", set: "good" }, { var: "consistency", set: "rock" }], then: { set: "gentle" } },
      { if: [{ var: "globalSkill", set: "expert" }], then: { set: "intense" } },
      { if: [{ var: "globalSkill", set: "novice" }], then: { set: "gentle" } }
    ]
  };

  /* ---- inference ---- */

  const STEPS = 200;

  function infer(inputs, ruleBase) {
    const output = ruleBase.output;
    const grid = new Array(STEPS + 1);
    for (let i = 0; i <= STEPS; i++) grid[i] = i / STEPS;

    const perSet = {};
    Object.keys(output.sets).forEach(function (name) {
      perSet[name] = new Array(STEPS + 1).fill(0);
    });

    ruleBase.rules.forEach(function (rule) {
      let strength = 1;
      for (let i = 0; i < rule.if.length; i++) {
        const antecedent = rule.if[i];
        const def = VARIABLES[antecedent.var] && VARIABLES[antecedent.var][antecedent.set];
        if (!def) {
          strength = 0;
          break;
        }
        const value = clamp01(inputs[antecedent.var]);
        strength = Math.min(strength, trapezoid(value, def));
      }
      if (strength <= 0) return;

      const targetDef = output.sets[rule.then.set];
      if (!targetDef) return;
      for (let i = 0; i <= STEPS; i++) {
        const m = Math.min(trapezoid(grid[i], targetDef), strength);
        if (m > perSet[rule.then.set][i]) perSet[rule.then.set][i] = m;
      }
    });

    /* max aggregation across the output sets, then centroid defuzzification */
    const combined = new Array(STEPS + 1).fill(0);
    Object.keys(perSet).forEach(function (name) {
      for (let i = 0; i <= STEPS; i++) {
        if (perSet[name][i] > combined[i]) combined[i] = perSet[name][i];
      }
    });

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i <= STEPS; i++) {
      numerator += grid[i] * combined[i];
      denominator += combined[i];
    }
    const value = denominator > 0 ? numerator / denominator : 0;

    let label = null;
    let best = -1;
    Object.keys(output.sets).forEach(function (name) {
      const m = trapezoid(value, output.sets[name]);
      if (m > best) {
        best = m;
        label = name;
      }
    });

    return {
      name: output.name,
      value: value,
      label: label,
      strength: best,
      grid: grid,
      distribution: combined
    };
  }

  /* ---- input extraction ---- */

  const DAY = 86400000;

  function recencyOf(lastSeenAt, now) {
    if (!lastSeenAt) return 0;
    const days = Math.max(0, (now - lastSeenAt) / DAY);
    return clamp01(Math.exp(-days / 10));
  }

  function speedOf(avgResponseMs, seen) {
    if (!seen || !avgResponseMs) return 0.5;
    return clamp01((12000 - avgResponseMs) / (12000 - 3000));
  }

  function globalSkillOf(profile, organelles) {
    let weighted = 0;
    let weight = 0;
    organelles.forEach(function (organelle) {
      const entry = profile.mastery[organelle.id];
      if (!entry || !entry.seen) return;
      weighted += entry.score * entry.seen;
      weight += entry.seen;
    });
    const masteryAverage = weight > 0 ? weighted / weight : 0;

    let correct = 0;
    let questions = 0;
    const recent = profile.sessions.slice(-5);
    recent.forEach(function (session) {
      correct += session.correct || 0;
      questions += session.questions || 0;
    });
    const sessionAccuracy = questions > 0 ? correct / questions : 0;

    if (weight === 0 && questions === 0) return 0;
    return clamp01(0.6 * masteryAverage + 0.4 * sessionAccuracy);
  }

  /* ---- per organelle evaluation ---- */

  function evaluateOrganelle(profile, organelle, globalSkill, now, storage) {
    const entry = profile.mastery[organelle.id] || null;
    const mastery = entry && entry.seen ? clamp01(entry.score) : 0;
    const consistency =
      entry && entry.recent && entry.recent.length >= 2
        ? clamp01(storage.computeConsistency(entry.recent))
        : 0.5;
    const recency = recencyOf(entry ? entry.lastSeenAt : 0, now);
    const speed = speedOf(entry ? entry.avgResponseMs : 0, entry ? entry.seen : 0);

    const inputs = {
      mastery: mastery,
      consistency: consistency,
      recency: recency,
      speed: speed,
      globalSkill: globalSkill
    };

    const demand = infer(inputs, DEMAND_RULES);
    const tier = infer(inputs, TIER_RULES);
    const pressure = infer(inputs, PRESSURE_RULES);

    const dueAt = entry ? entry.dueAt || 0 : 0;
    const due = dueAt > 0 && dueAt <= now;
    const errorRate = entry && entry.seen ? entry.wrong / entry.seen : 0;

    /* Priority blends the fuzzy demand with the raw evidence: a topic you
       have already answered wrongly outranks one you simply have not met. */
    const priority =
      0.55 * demand.value +
      0.2 * (1 - mastery) +
      0.1 * (1 - recency) +
      0.15 * errorRate +
      (due ? 0.08 : 0);

    return {
      id: organelle.id,
      name: organelle.name,
      blurb: organelle.blurb,
      mastery: mastery,
      consistency: consistency,
      recency: recency,
      speed: speed,
      seen: entry ? entry.seen : 0,
      correct: entry ? entry.correct : 0,
      wrong: entry ? entry.wrong : 0,
      due: due,
      dueAt: dueAt,
      demand: demand.value,
      demandLabel: demand.label,
      tierValue: tier.value,
      tierLabel: tier.label,
      pressure: pressure.value,
      pressureLabel: pressure.label,
      priority: priority
    };
  }

  function tierFromValue(value) {
    if (value < 0.35) return "easy";
    if (value < 0.68) return "medium";
    return "hard";
  }

  function explain(evaluation) {
    if (evaluation.seen === 0) return "New topic — starting with a warm-up question.";
    if (evaluation.due) return "Review due — last seen a while ago, so it is back in the deck.";
    if (evaluation.mastery < 0.3) return "Still shaky — extra practice and an easier question.";
    if (evaluation.consistency < 0.5) return "Inconsistent answers — repeating to lock it in.";
    if (evaluation.mastery > 0.7 && evaluation.recency > 0.6)
      return "Strong and recent — pushing you with a challenge question.";
    if (evaluation.mastery > 0.7) return "Strong from before — a quick confidence check.";
    return "Solid — a standard question to keep it steady.";
  }

  /* ---- session planning ---- */

  function planSession(profile, options, organelles, storage) {
    const data = global.GTC.data;
    const mode = data.modes[options.mode] || data.modes.classic;
    const now = options.now || Date.now();

    const pairs = Math.max(4, Math.min(10, options.pairs || mode.pairs));
    const globalSkill = globalSkillOf(profile, organelles);

    const evaluations = organelles.map(function (organelle) {
      return evaluateOrganelle(profile, organelle, globalSkill, now, storage);
    });

    const ranked = evaluations.slice().sort(function (a, b) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.name.localeCompare(b.name);
    });

    const chosen = ranked.slice(0, pairs);
    const chosenIds = {};
    chosen.forEach(function (item) { chosenIds[item.id] = true; });

    /* Reinforcement: the topics that most need it get a second pair on the
       board, which means a second question on the same structure. */
    const reinforcementCount = Math.max(0, mode.reinforcements);
    const reinforcementPool = chosen
      .slice()
      .sort(function (a, b) {
        const aDue = a.due ? 1 : 0;
        const bDue = b.due ? 1 : 0;
        if (aDue !== bDue) return bDue - aDue;
        return b.priority - a.priority;
      })
      .slice(0, reinforcementCount);

    const reinforcementIds = {};
    reinforcementPool.forEach(function (item) { reinforcementIds[item.id] = true; });

    const maxPairs = 12;
    const deck = [];
    let reinforcementBudget = Math.max(0, maxPairs - pairs);
    chosen.forEach(function (item) {
      const organelle = organelles.filter(function (o) { return o.id === item.id; })[0];
      const tier = tierFromValue(item.tierValue);
      const question = pickQuestion(organelle, tier);
      let copies = 1;
      if (reinforcementIds[item.id] && reinforcementBudget > 0) {
        copies = 2;
        reinforcementBudget -= 1;
      }
      deck.push({
        id: organelle.id,
        name: organelle.name,
        blurb: organelle.blurb,
        svg: organelle.svg,
        accent: organelle.accent,
        tier: tier,
        question: question,
        copies: copies,
        evaluation: item
      });
    });

    const avgDemand =
      deck.length > 0
        ? deck.reduce(function (sum, entry) { return sum + entry.evaluation.demand; }, 0) / deck.length
        : 0;
    const avgPressure =
      deck.length > 0
        ? deck.reduce(function (sum, entry) { return sum + entry.evaluation.pressure; }, 0) / deck.length
        : 0;

    const pressureScale = 0.7 + 0.6 * clamp01(avgPressure);

    return {
      mode: mode,
      pairs: pairs,
      deck: deck,
      evaluations: evaluations,
      ranked: ranked,
      chosen: chosen,
      globalSkill: globalSkill,
      demand: avgDemand,
      demandLabel: labelForDemand(avgDemand),
      pressure: avgPressure,
      pressureLabel: labelForPressure(avgPressure),
      modifiers: {
        penaltyScale: mode.penaltyScale * pressureScale,
        shuffleOnWrong: avgPressure > 0.34,
        hintsEnabled: mode.hints && profile.settings.hints !== false,
        typeInEnabled: profile.settings.typeIn !== false,
        extraOptions: mode.extraOptions,
        basePoints: mode.basePoints,
        speedBonus: mode.speedBonus,
        seconds: mode.seconds
      }
    };
  }

  function pickQuestion(organelle, tier) {
    const questions = organelle.questions || [];
    const exact = questions.filter(function (q) { return q.tier === tier; })[0];
    if (exact) return exact;
    const fallback = questions[0];
    return fallback;
  }

  function labelForDemand(value) {
    if (value < 0.35) return "gentle";
    if (value < 0.68) return "moderate";
    return "intense";
  }

  function labelForPressure(value) {
    if (value < 0.35) return "gentle";
    if (value < 0.68) return "moderate";
    return "intense";
  }

  function labelForMastery(value) {
    if (value < 0.3) return "Poor";
    if (value < 0.65) return "Average";
    return "Strong";
  }

  /* ---- review queue for the learning profile ---- */

  function reviewQueue(profile, organelles, now) {
    const time = now || Date.now();
    return organelles
      .map(function (organelle) {
        const entry = profile.mastery[organelle.id];
        const seen = entry ? entry.seen : 0;
        const mastery = seen ? clamp01(entry.score) : 0;
        const dueAt = entry ? entry.dueAt || 0 : 0;
        const overdue = dueAt > 0 ? Math.max(0, (time - dueAt) / DAY) : 0;
        const urgency = clamp01(
          0.6 * (1 - mastery) + 0.25 * (seen ? 1 : 0.4) + 0.15 * clamp01(overdue / 3)
        );
        return {
          id: organelle.id,
          name: organelle.name,
          accent: organelle.accent,
          seen: seen,
          mastery: mastery,
          masteryLabel: labelForMastery(mastery),
          due: dueAt > 0 && dueAt <= time,
          dueAt: dueAt,
          overdueDays: overdue,
          urgency: urgency
        };
      })
      .sort(function (a, b) { return b.urgency - a.urgency; });
  }

  /* ---- fuzzy string matching for the type-in answer box ---- */

  function normaliseText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    let curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      const swap = prev;
      prev = curr;
      curr = swap;
    }
    return prev[b.length];
  }

  function ratio(a, b) {
    if (!a.length && !b.length) return 1;
    const longest = Math.max(a.length, b.length);
    if (!longest) return 0;
    return 1 - levenshtein(a, b) / longest;
  }

  function tokenOverlap(a, b) {
    const tokensA = a.split(" ").filter(Boolean);
    const tokensB = b.split(" ").filter(Boolean);
    if (!tokensA.length || !tokensB.length) return 0;
    let matched = 0;
    tokensA.forEach(function (token) {
      const hit = tokensB.some(function (other) {
        return other === token || ratio(token, other) > 0.8;
      });
      if (hit) matched += 1;
    });
    return matched / tokensA.length;
  }

  function isSubsequence(needle, haystack) {
    let index = 0;
    for (let i = 0; i < haystack.length && index < needle.length; i++) {
      if (haystack[i] === needle[index]) index += 1;
    }
    return index === needle.length;
  }

  function similarity(input, target) {
    const a = normaliseText(input);
    const b = normaliseText(target);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const edit = ratio(a, b);
    const overlap = tokenOverlap(a, b);
    const sub = isSubsequence(a.replace(/\s/g, ""), b.replace(/\s/g, "")) ? 0.82 : 0;
    return Math.max(edit, overlap * 0.95, sub);
  }

  function matchAnswer(input, correctText, distractors) {
    const best = similarity(input, correctText);
    let rival = 0;
    (distractors || []).forEach(function (option) {
      const score = similarity(input, option);
      if (score > rival) rival = score;
    });
    const threshold = 0.82;
    return {
      score: best,
      rival: rival,
      correct: best >= threshold && best >= rival,
      close: best >= 0.6 && best < threshold
    };
  }

  global.GTC = global.GTC || {};
  global.GTC.fuzzy = {
    VARIABLES: VARIABLES,
    OUTPUTS: OUTPUTS,
    DEMAND_RULES: DEMAND_RULES,
    TIER_RULES: TIER_RULES,
    PRESSURE_RULES: PRESSURE_RULES,
    trapezoid: trapezoid,
    clamp01: clamp01,
    infer: infer,
    globalSkillOf: globalSkillOf,
    evaluateOrganelle: evaluateOrganelle,
    planSession: planSession,
    reviewQueue: reviewQueue,
    tierFromValue: tierFromValue,
    labelForDemand: labelForDemand,
    labelForPressure: labelForPressure,
    labelForMastery: labelForMastery,
    explain: explain,
    similarity: similarity,
    matchAnswer: matchAnswer
  };
})(window);
