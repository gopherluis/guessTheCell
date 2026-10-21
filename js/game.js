/* Guess the Cell — game engine.

   The session is planned by the fuzzy engine (js/fuzzy.js): it picks the
   organelles on the board, how many extra reinforcement pairs to add and
   which question tier to ask. Every answer feeds back into the persisted
   profile so the next session is tuned to what the player still struggles
   with. */
(function (global) {
  "use strict";

  const GTC = global.GTC;
  const data = GTC.data;
  const storage = GTC.storage;
  const fuzzy = GTC.fuzzy;
  const themes = GTC.themes;
  const audio = GTC.audio;

  const FLIP_DOWN_MS = 380;
  const MISMATCH_SHOW_MS = 750;
  const SHUFFLE_MS = 550;
  const HINT_PENALTY = 12;

  const board = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const attemptsEl = document.getElementById("attempts");
  const errorsEl = document.getElementById("errors");
  const streakEl = document.getElementById("streak");
  const quitBtn = document.getElementById("quit-btn");

  const planFocus = document.getElementById("plan-focus");
  const planDemand = document.getElementById("plan-demand");
  const planBoost = document.getElementById("plan-boost");
  const planToggle = document.getElementById("plan-toggle");
  const planDetail = document.getElementById("plan-detail");

  const resumeBar = document.getElementById("resume-bar");
  const resumeBtn = document.getElementById("resume-btn");
  const resumeDiscardBtn = document.getElementById("resume-discard-btn");
  const resumeText = document.getElementById("resume-text");

  const quizOverlay = document.getElementById("quiz-overlay");
  const quizName = document.getElementById("quiz-name");
  const quizIllustration = document.getElementById("quiz-illustration");
  const quizTier = document.getElementById("quiz-tier");
  const quizQuestion = document.getElementById("quiz-question");
  const quizOptions = document.getElementById("quiz-options");
  const quizFeedback = document.getElementById("quiz-feedback");
  const quizContinue = document.getElementById("quiz-continue");
  const quizHint = document.getElementById("quiz-hint");
  const quizHintBtn = document.getElementById("quiz-hint-btn");
  const quizHintText = document.getElementById("quiz-hint-text");
  const typeInForm = document.getElementById("typein-form");
  const typeInInput = document.getElementById("typein-input");
  const typeInResult = document.getElementById("typein-result");

  const resultsOverlay = document.getElementById("results-overlay");
  const resultsTitle = document.getElementById("results-title");
  const resultsSubtitle = document.getElementById("results-subtitle");
  const resultScore = document.getElementById("result-score");
  const resultCorrect = document.getElementById("result-correct");
  const resultAttempts = document.getElementById("result-attempts");
  const resultErrors = document.getElementById("result-errors");
  const resultTime = document.getElementById("result-time");
  const resultStreak = document.getElementById("result-streak");
  const resultInsight = document.getElementById("result-insight");
  const resultMastery = document.getElementById("result-mastery");
  const resultReview = document.getElementById("result-review");
  const replayBtn = document.getElementById("replay-btn");
  const resultsQuitBtn = document.getElementById("results-quit-btn");

  const gridEl = document.getElementById("board-grid");
  void gridEl;

  const themeMenuEl = document.querySelector("[data-theme-menu]");

  /* ---- state ---- */

  let profile = storage.loadProfile();
  let plan = null;
  let cards = [];
  let order = [];
  let matchedFlags = [];
  let flipped = [];
  let pendingPair = null;
  let lastAnswerCorrect = false;
  let busy = false;
  let gameOver = false;
  let stats = { score: 0, attempts: 0, errors: 0, correct: 0, streak: 0, bestStreak: 0 };
  let elapsedSeconds = 0;
  let timerId = null;
  let answeredHistory = {};
  let pairCounts = {};
  let activeOrganelle = null;
  let activeQuestion = null;
  let activeOptions = [];
  let activeCorrectIndex = 0;
  let hintUsed = false;
  let typeInAttempts = 0;
  let questionStartedAt = 0;
  let savedRun = null;

  /* ---- helpers ---- */

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = array[i];
      array[i] = array[j];
      array[j] = tmp;
    }
    return array;
  }

  function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return minutes + ":" + seconds;
  }

  function clamp01(value) {
    return fuzzy.clamp01(value);
  }

  function nextHarderTier(tier) {
    if (tier === "easy") return "medium";
    if (tier === "medium") return "hard";
    return "hard";
  }

  function organelleFor(entry) {
    return (
      data.organelles.filter(function (o) { return o.id === entry.id; })[0] || entry
    );
  }

  function questionFor(entry, plannedTier) {
    const organelle = organelleFor(entry);
    const history = answeredHistory[entry.id] || [];
    let tier = plannedTier;
    if (history.length) {
      const last = history[history.length - 1];
      tier = last.correct ? nextHarderTier(last.tier) : last.tier;
    }
    const match = organelle.questions.filter(function (q) { return q.tier === tier; })[0];
    return match || entry.question || organelle.questions[0];
  }

  /* ---- HUD ---- */

  function updateHud() {
    scoreEl.textContent = String(stats.score);
    attemptsEl.textContent = String(stats.attempts);
    errorsEl.textContent = String(stats.errors);
    streakEl.textContent = String(stats.streak);
    if (plan && plan.modifiers.seconds) {
      const left = Math.max(0, plan.modifiers.seconds - elapsedSeconds);
      timerEl.textContent = formatTime(left);
      timerEl.classList.toggle("is-urgent", left <= 15);
    } else {
      timerEl.textContent = formatTime(elapsedSeconds);
      timerEl.classList.remove("is-urgent");
    }
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(function () {
      if (gameOver) return;
      elapsedSeconds += 1;
      if (plan && plan.modifiers.seconds && elapsedSeconds >= plan.modifiers.seconds) {
        elapsedSeconds = plan.modifiers.seconds;
        updateHud();
        endGame(false, "Time is up!");
        return;
      }
      updateHud();
    }, 1000);
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  /* ---- board ---- */

  function buildCards(deck) {
    const list = [];
    deck.forEach(function (entry) {
      /* copies counts pairs, and every pair is two cards. */
      for (let i = 0; i < entry.copies * 2; i++) {
        list.push({ entry: entry, occurrence: i });
      }
    });
    return list;
  }

  function createCardElement(card, index) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "card";
    el.setAttribute("aria-label", "Face-down card");
    el.setAttribute("aria-pressed", "false");

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "card-face card-back";
    back.innerHTML = currentBackSvg();

    const front = document.createElement("div");
    front.className = "card-face card-front";
    front.style.setProperty("--card-accent", card.entry.accent);
    front.innerHTML = card.entry.svg;

    const label = document.createElement("span");
    label.className = "card-name";
    label.textContent = card.entry.name;

    inner.appendChild(back);
    inner.appendChild(front);
    el.appendChild(inner);
    front.appendChild(label);

    el.addEventListener("click", function () {
      onCardClick(index);
    });
    return el;
  }

  function currentBackSvg() {
    const backId = profile.settings.cardBack;
    const back = data.cardBacks[backId] || data.cardBacks.cell;
    return back.svg;
  }

  function renderBoard() {
    board.innerHTML = "";
    order.forEach(function (cardIndex, position) {
      const card = cards[cardIndex];
      const el = createCardElement(card, cardIndex);
      el.style.order = String(position);
      board.appendChild(el);
      card.el = el;
      if (matchedFlags[cardIndex]) {
        el.classList.add("matched");
        el.setAttribute("aria-label", card.entry.name + " card, matched");
      }
    });
    layoutBoard();
  }

  function boardGap() {
    const styles = getComputedStyle(board);
    const gap = parseFloat(styles.columnGap || styles.gap);
    return isFinite(gap) && gap > 0 ? gap : 12;
  }

  function availableBoardWidth() {
    const parent = board.parentElement;
    if (!parent) return board.clientWidth;
    const styles = getComputedStyle(parent);
    const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    return Math.max(0, parent.clientWidth - padding);
  }

  /* Pick a column count that keeps every card readable and tries to fit the
     board on screen. It adapts to the number of cards, so 4 pairs and 12 pairs
     both end up with a balanced grid on any viewport. */
  function columnsFor(count) {
    if (count <= 1) return Math.max(1, count);
    const gap = boardGap();
    const width = availableBoardWidth();
    if (!width) return Math.min(4, count);

    const boardTop = board.getBoundingClientRect().top;
    const height = Math.max(160, window.innerHeight - boardTop - 16);
    const minWidth = width < 480 ? 56 : 64;
    const maxWidth = 150;
    const limit = Math.max(
      1,
      Math.min(count, Math.floor((width + gap) / (minWidth + gap)))
    );

    let best = 1;
    let bestScore = -Infinity;
    for (let cols = 1; cols <= limit; cols++) {
      const rows = Math.ceil(count / cols);
      const cardWidth = (width - gap * (cols - 1)) / cols;
      const boardHeight = rows * cardWidth * (4 / 3) + gap * (rows - 1);
      const overflow = Math.max(0, boardHeight - height);
      const empty = rows * cols - count;
      const score =
        Math.min(cardWidth, maxWidth) -
        overflow * 6 -
        empty * 4 -
        (rows > cols ? 6 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = cols;
      }
    }
    return best;
  }

  function layoutBoard() {
    if (!order.length) return;
    const count = order.length;
    const gap = boardGap();
    const width = availableBoardWidth();
    if (width < 1) return;
    const columns = columnsFor(count);
    board.style.setProperty("--board-columns", String(columns));
    const cardWidth = Math.max(
      1,
      Math.floor(Math.min(150, (width - gap * (columns - 1)) / columns))
    );
    board.style.setProperty("--board-card-width", cardWidth + "px");
    board.style.maxWidth =
      Math.round(columns * cardWidth + gap * (columns - 1)) + "px";
  }

  function setFlipped(cardIndex, flippedState) {
    const card = cards[cardIndex];
    card.flipped = flippedState;
    if (!card.el) return;
    card.el.classList.toggle("flipped", flippedState);
    card.el.setAttribute("aria-pressed", flippedState ? "true" : "false");
    card.el.setAttribute(
      "aria-label",
      flippedState ? card.entry.name + " card" : "Face-down card"
    );
  }

  function onCardClick(cardIndex) {
    if (busy || gameOver) return;
    if (matchedFlags[cardIndex]) return;
    if (cards[cardIndex].flipped) return;

    audio.play("flip");
    setFlipped(cardIndex, true);
    flipped.push(cardIndex);

    if (flipped.length < 2) return;

    busy = true;
    const first = flipped[0];
    const second = flipped[1];
    flipped = [];
    stats.attempts += 1;
    updateHud();

    if (cards[first].entry.id === cards[second].entry.id) {
      pendingPair = { first: first, second: second };
      setTimeout(function () {
        openQuiz(cards[first].entry);
      }, FLIP_DOWN_MS + 140);
    } else {
      setTimeout(function () {
        flipDown([first, second]);
        busy = false;
      }, MISMATCH_SHOW_MS);
    }
  }

  function flipDown(cardIndexes) {
    cardIndexes.forEach(function (index) {
      setFlipped(index, false);
    });
  }

  function shuffleUnmatched() {
    const unmatchedIndexes = [];
    order.forEach(function (cardIndex, position) {
      if (!matchedFlags[cardIndex]) unmatchedIndexes.push(position);
    });
    if (unmatchedIndexes.length < 2) {
      busy = false;
      return;
    }

    const cardsToShuffle = unmatchedIndexes.map(function (position) {
      return order[position];
    });
    shuffle(cardsToShuffle);

    const firstRects = new Map();
    cardsToShuffle.forEach(function (cardIndex) {
      firstRects.set(cardIndex, cards[cardIndex].el.getBoundingClientRect());
    });

    unmatchedIndexes.forEach(function (position, i) {
      order[position] = cardsToShuffle[i];
    });
    renderBoard();

    cardsToShuffle.forEach(function (cardIndex) {
      const first = firstRects.get(cardIndex);
      const last = cards[cardIndex].el.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (dx !== 0 || dy !== 0) {
        cards[cardIndex].el.style.transition = "none";
        cards[cardIndex].el.style.transform = "translate(" + dx + "px, " + dy + "px)";
        void cards[cardIndex].el.offsetWidth;
        cards[cardIndex].el.style.transition = "transform " + SHUFFLE_MS + "ms ease";
        cards[cardIndex].el.style.transform = "";
      }
    });

    setTimeout(function () {
      cardsToShuffle.forEach(function (cardIndex) {
        cards[cardIndex].el.style.transition = "";
        cards[cardIndex].el.style.transform = "";
      });
      busy = false;
      saveRun();
    }, SHUFFLE_MS + 40);
  }

  /* ---- quiz ---- */

  function openQuiz(entry) {
    const question = questionFor(entry, entry.tier);
    activeOrganelle = entry;
    activeQuestion = question;
    hintUsed = false;
    typeInAttempts = 0;
    questionStartedAt = Date.now();

    quizName.textContent = entry.name;
    quizIllustration.innerHTML = entry.svg;
    quizTier.textContent = data.tiers[question.tier].name;
    quizTier.setAttribute("data-tier", question.tier);
    quizQuestion.textContent = question.text;
    quizOptions.innerHTML = "";
    quizFeedback.textContent = "";
    quizFeedback.className = "modal-feedback";
    quizContinue.classList.add("is-hidden");
    quizContinue.disabled = true;
    quizHint.classList.add("is-hidden");
    quizHintText.textContent = "";
    if (quizHintBtn) {
      quizHintBtn.classList.toggle("is-hidden", !plan.modifiers.hintsEnabled);
      quizHintBtn.disabled = false;
    }
    typeInResult.textContent = "";
    if (typeInInput) typeInInput.value = "";

    const options = question.options.slice();
    const optionOrder = question.options.map(function (_, index) { return index; });
    shuffle(optionOrder);
    activeOptions = optionOrder.map(function (index) { return question.options[index]; });
    activeCorrectIndex = optionOrder.indexOf(question.correct);

    activeOptions.forEach(function (option, index) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        onQuizAnswer(index);
      });
      quizOptions.appendChild(btn);
    });

    if (typeInForm) {
      typeInForm.classList.toggle("is-hidden", !plan.modifiers.typeInEnabled);
    }

    quizOverlay.classList.add("is-open");
    quizOverlay.setAttribute("aria-hidden", "false");
    const buttons = quizOptions.querySelectorAll(".option-btn");
    if (buttons.length > 0) buttons[0].focus();
  }

  function onQuizAnswer(index) {
    if (!activeQuestion) return;
    const buttons = quizOptions.querySelectorAll(".option-btn");
    if (buttons.length && buttons[0].disabled) return;

    const correct = activeCorrectIndex;
    const answeredCorrectly = index === correct;
    const responseMs = Date.now() - questionStartedAt;
    lastAnswerCorrect = answeredCorrectly;

    buttons.forEach(function (btn) { btn.disabled = true; });
    buttons[correct].classList.add("is-correct");
    if (!answeredCorrectly) buttons[index].classList.add("is-wrong");

    quizFeedback.textContent = feedbackFor(activeOrganelle, answeredCorrectly);
    quizFeedback.classList.add(answeredCorrectly ? "is-good" : "is-bad");

    applyScoring(answeredCorrectly, responseMs, activeQuestion.tier);
    recordAnswer(activeOrganelle.id, answeredCorrectly, responseMs, activeQuestion.tier);

    quizContinue.disabled = false;
    quizContinue.textContent = answeredCorrectly ? "Continue" : "Shuffle & continue";
    quizContinue.classList.remove("is-hidden");
    quizContinue.focus();
  }

  function feedbackFor(entry, correct) {
    if (correct) {
      return "Correct. " + (entry.blurb || "");
    }
    return "Not quite — the right answer was \"" +
      activeOptions[activeCorrectIndex] +
      "\". " +
      (entry.blurb || "");
  }

  function applyScoring(correct, responseMs, tier) {
    const tierPoints = data.tiers[tier].points;
    if (correct) {
      stats.correct += 1;
      stats.streak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
      let gain = tierPoints;
      gain += Math.min(stats.streak - 1, 5) * 8;
      if (plan.modifiers.speedBonus) {
        const speedFactor = clamp01(1 - (responseMs - 2500) / 12000);
        gain += Math.round(tierPoints * 0.6 * speedFactor);
      }
      stats.score += gain;
      audio.play(stats.streak > 1 && stats.streak % 3 === 0 ? "streak" : "correct");
    } else {
      stats.errors += 1;
      stats.streak = 0;
      stats.score -= Math.round(30 * plan.modifiers.penaltyScale);
      audio.play("wrong");
    }
    updateHud();
  }

  function recordAnswer(organelleId, correct, responseMs, tier) {
    if (!answeredHistory[organelleId]) answeredHistory[organelleId] = [];
    answeredHistory[organelleId].push({ correct: correct, responseMs: responseMs, tier: tier });
    pairCounts[organelleId] = (pairCounts[organelleId] || 0) + 1;
    storage.recordOrganelleResult(profile, organelleId, {
      correct: correct,
      responseMs: responseMs,
      tier: tier
    });
    storage.saveProfile(profile);
  }

  function onTypeInSubmit(event) {
    if (event) event.preventDefault();
    if (!activeQuestion) return;
    const value = typeInInput.value;
    if (!value.trim()) return;
    typeInAttempts += 1;

    const result = fuzzy.matchAnswer(
      value,
      activeOptions[activeCorrectIndex],
      activeOptions.filter(function (_, i) { return i !== activeCorrectIndex; })
    );

    if (result.correct) {
      typeInResult.textContent = "Accepted — nice fuzzy match (" + Math.round(result.score * 100) + "% similar).";
      typeInResult.className = "typein-result is-good";
      onQuizAnswer(activeCorrectIndex);
      return;
    }

    if (result.close && typeInAttempts < 3) {
      typeInResult.textContent = "Close! Keep going — the right answer starts with \"" +
        activeOptions[activeCorrectIndex].charAt(0).toUpperCase() + "\".";
      typeInResult.className = "typein-result is-close";
      return;
    }

    typeInResult.textContent = "Not quite. Try one of the options below.";
    typeInResult.className = "typein-result is-bad";
  }

  function useHint() {
    if (!activeQuestion || hintUsed) return;
    hintUsed = true;
    const answer = activeOptions[activeCorrectIndex];
    quizHintText.textContent =
      "Hint: it starts with \"" + answer.charAt(0).toUpperCase() + "\" — " +
      (activeOrganelle.blurb || "");
    quizHint.classList.remove("is-hidden");
    if (quizHintBtn) quizHintBtn.disabled = true;
    stats.score -= HINT_PENALTY;
    updateHud();
    audio.play("tick");
  }

  function closeQuiz(wasCorrect) {
    quizOverlay.classList.remove("is-open");
    quizOverlay.setAttribute("aria-hidden", "true");

    if (!pendingPair) {
      busy = false;
      return;
    }
    const pair = pendingPair;
    pendingPair = null;

    if (wasCorrect) {
      matchedFlags[pair.first] = true;
      matchedFlags[pair.second] = true;
      const card = cards[pair.first];
      card.el.classList.add("matched");
      cards[pair.second].el.classList.add("matched");
      stats.score += plan.modifiers.basePoints;
      updateHud();
      audio.play("match");
      saveRun();
      busy = false;
      checkWin();
    } else {
      flipDown([pair.first, pair.second]);
      const reshuffle = plan.modifiers.shuffleOnWrong;
      setTimeout(function () {
        if (reshuffle) {
          audio.play("shuffle");
          shuffleUnmatched();
        } else {
          busy = false;
        }
      }, FLIP_DOWN_MS);
    }
  }

  /* ---- win / results ---- */

  function checkWin() {
    const allMatched = matchedFlags.every(function (flag) { return flag; });
    if (allMatched) {
      endGame(true, "Board cleared!");
    }
  }

  function endGame(won, message) {
    if (gameOver) return;
    gameOver = true;
    stopTimer();
    saveRun();

    const questions = stats.correct + stats.errors;
    storage.recordSession(profile, {
      score: stats.score,
      timeMs: elapsedSeconds * 1000,
      attempts: stats.attempts,
      errors: stats.errors,
      correct: stats.correct,
      questions: questions,
      demand: plan ? plan.demand : 0,
      mode: plan ? plan.mode.id : "classic",
      win: won
    });
    storage.saveProfile(profile);
    storage.clearRun();

    setTimeout(function () {
      showResults(won, message);
    }, 420);
  }

  function showResults(won, message) {
    resultsTitle.textContent = won ? message || "Board cleared!" : "Run over";
    resultsSubtitle.textContent = won
      ? "Every pair is locked. Here is how you did:"
      : "Time ran out. Here is how far you got:";
    resultScore.textContent = String(stats.score);
    resultCorrect.textContent = stats.correct + " / " + (stats.correct + stats.errors);
    resultAttempts.textContent = String(stats.attempts);
    resultErrors.textContent = String(stats.errors);
    resultTime.textContent = formatTime(elapsedSeconds);
    resultStreak.textContent = String(stats.bestStreak);

    resultInsight.textContent = buildInsight(won);
    renderMasteryChanges();
    renderReviewList();

    resultsOverlay.classList.add("is-open");
    resultsOverlay.setAttribute("aria-hidden", "false");
    replayBtn.focus();
  }

  function buildInsight(won) {
    if (!plan) return "";
    const focus = plan.ranked[0];
    const boost = plan.deck.filter(function (entry) { return entry.copies > 1; });
    const bits = [];
    bits.push(
      "The engine read your history as " +
        plan.demandLabel +
        " reinforcement demand and " +
        plan.pressureLabel +
        " pressure."
    );
    if (focus) {
      bits.push("It prioritised " + focus.name + " (mastery " + fuzzy.labelForMastery(focus.mastery) + ").");
    }
    if (boost.length) {
      bits.push(
        boost.length === 1
          ? boost[0].name + " got a second pair to reinforce it."
          : boost.map(function (b) { return b.name; }).join(" and ") + " each got an extra pair."
      );
    }
    if (!won) {
      bits.push("Speed is one lever — Sprint mode pays a bonus for fast answers.");
    }
    return bits.join(" ");
  }

  function renderMasteryChanges() {
    resultMastery.innerHTML = "";
    plan.deck.forEach(function (entry) {
      const evaluation = entry.evaluation || { mastery: 0 };
      const history = answeredHistory[entry.id] || [];
      const answered = history.length;
      const right = history.filter(function (h) { return h.correct; }).length;
      const before = evaluation.mastery || 0;
      const after = profile.mastery[entry.id] ? profile.mastery[entry.id].score : before;
      const delta = after - before;
      const li = document.createElement("li");
      li.className = "mastery-row";
      li.innerHTML =
        '<span class="mastery-dot" style="background:' + entry.accent + '"></span>' +
        '<span class="mastery-name">' + entry.name + "</span>" +
        '<span class="mastery-bar"><span class="mastery-fill" style="width:' +
        Math.round(after * 100) + '%"></span></span>' +
        '<span class="mastery-delta">' + (delta >= 0 ? "+" : "") + Math.round(delta * 100) + "%</span>" +
        '<span class="mastery-tally">' + right + "/" + answered + "</span>";
      resultMastery.appendChild(li);
    });
  }

  function renderReviewList() {
    resultReview.innerHTML = "";
    const queue = fuzzy.reviewQueue(profile, data.organelles).slice(0, 3);
    if (!queue.length) return;
    queue.forEach(function (item) {
      const li = document.createElement("li");
      li.className = "mastery-row";
      li.innerHTML =
        '<span class="mastery-dot" style="background:' + item.accent + '"></span>' +
        '<span class="mastery-name">' + item.name + "</span>" +
        '<span class="mastery-state">' + item.masteryLabel +
        (item.due ? " · due" : "") + "</span>";
      resultReview.appendChild(li);
    });
  }

  /* ---- plan strip ---- */

  function renderPlan() {
    if (!plan) return;
    const focusNames = plan.ranked.slice(0, 3).map(function (item) { return item.name; });
    if (planFocus) planFocus.textContent = focusNames.length ? focusNames.join(" · ") : "restored run";
    if (planDemand) {
      planDemand.textContent = plan.demandLabel;
      planDemand.setAttribute("data-level", plan.demandLabel);
    }
    const boosted = plan.deck.filter(function (entry) { return entry.copies > 1; });
    if (planBoost) {
      planBoost.textContent = boosted.length
        ? boosted.length + " reinforced"
        : "no extra pairs";
    }
    if (planDetail) {
      const lines = plan.deck.slice(0, 6).map(function (entry) {
        const evaluation = entry.evaluation || { mastery: 0, demand: 0, demandLabel: "gentle" };
        return (
          "<li><strong>" + entry.name + "</strong> — " +
          fuzzy.explain(evaluation) +
          ' <span class="plan-tag">demand: ' + (evaluation.demandLabel || "gentle") + "</span>" +
          " · <span class=\"plan-tag\">" + data.tiers[entry.tier].name + " question</span></li>"
        );
      });
      planDetail.innerHTML =
        "<p>The engine scored every structure and fired its rule base. " +
        "Average reinforcement demand: <strong>" + plan.demandLabel + "</strong>, " +
        "pressure: <strong>" + plan.pressureLabel + "</strong>.</p><ul>" +
        lines.join("") +
        "</ul>";
    }
  }

  /* ---- run persistence ---- */

  function saveRun() {
    if (gameOver || !plan) return;
    storage.saveRun({
      mode: plan.mode.id,
      pairs: plan.pairs,
      deck: plan.deck.map(function (entry) {
        return {
          id: entry.id,
          name: entry.name,
          blurb: entry.blurb,
          svg: entry.svg,
          accent: entry.accent,
          tier: entry.tier,
          copies: entry.copies,
          question: entry.question
        };
      }),
      order: order.slice(),
      matched: matchedFlags.slice(),
      stats: Object.assign({}, stats),
      elapsedSeconds: elapsedSeconds,
      answeredHistory: answeredHistory,
      pairCounts: pairCounts,
      demand: plan.demand,
      demandLabel: plan.demandLabel,
      pressureLabel: plan.pressureLabel,
      modifiers: plan.modifiers
    });
  }

  function restoreRun(run) {
    plan = {
      mode: data.modes[run.mode] || data.modes.classic,
      pairs: run.pairs,
      deck: run.deck,
      evaluations: [],
      ranked: [],
      chosen: [],
      demand: run.demand || 0,
      demandLabel: run.demandLabel || "moderate",
      pressureLabel: run.pressureLabel || "moderate",
      modifiers: run.modifiers
    };
    cards = buildCards(plan.deck);
    order = run.order.slice();
    matchedFlags = run.matched.slice();
    stats = Object.assign({ score: 0, attempts: 0, errors: 0, correct: 0, streak: 0, bestStreak: 0 }, run.stats);
    elapsedSeconds = run.elapsedSeconds || 0;
    answeredHistory = run.answeredHistory || {};
    pairCounts = run.pairCounts || {};
  }

  /* ---- session lifecycle ---- */

  function startNewSession() {
    storage.clearRun();
    profile = storage.loadProfile();
    plan = fuzzy.planSession(
      profile,
      { mode: profile.settings.mode, pairs: profile.settings.pairs },
      data.organelles,
      storage
    );
    cards = buildCards(plan.deck);
    order = shuffle(cards.map(function (_, i) { return i; }));
    matchedFlags = cards.map(function () { return false; });
    stats = { score: 0, attempts: 0, errors: 0, correct: 0, streak: 0, bestStreak: 0 };
    elapsedSeconds = 0;
    answeredHistory = {};
    pairCounts = {};
    flipped = [];
    pendingPair = null;
    busy = false;
    gameOver = false;
    renderBoard();
    renderPlan();
    updateHud();
    startTimer();
    saveRun();
  }

  function resumeSavedRun() {
    savedRun = storage.loadRun();
    if (!savedRun) {
      startNewSession();
      return;
    }

    /* A run was left open in this browser: restore it exactly as it was. */
    restoreRun(savedRun);
    renderBoard();
    renderPlan();
    updateHud();
    startTimer();

    resumeBar.classList.remove("is-hidden");
    if (resumeText) {
      resumeText.textContent =
        "Restored the run you left open in this browser (" +
        (savedRun.stats ? savedRun.stats.score : 0) +
        " points so far).";
    }
    resumeBtn.textContent = "Start fresh board";
    resumeBtn.addEventListener("click", function () {
      resumeBar.classList.add("is-hidden");
      storage.clearRun();
      startNewSession();
    });
    if (resumeDiscardBtn) resumeDiscardBtn.classList.add("is-hidden");
  }

  /* ---- events ---- */

  quizContinue.addEventListener("click", function () {
    closeQuiz(lastAnswerCorrect);
  });

  if (typeInForm) {
    typeInForm.addEventListener("submit", onTypeInSubmit);
  }
  if (quizHint) {
    quizHint.addEventListener("click", useHint);
  }
  if (planToggle && planDetail) {
    planToggle.addEventListener("click", function () {
      const open = planDetail.classList.toggle("is-open");
      planToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  quitBtn.addEventListener("click", function () {
    saveRun();
    window.location.href = "index.html";
  });
  resultsQuitBtn.addEventListener("click", function () {
    window.location.href = "index.html";
  });
  replayBtn.addEventListener("click", function () {
    startNewSession();
    resultsOverlay.classList.remove("is-open");
    resultsOverlay.setAttribute("aria-hidden", "true");
  });

  window.addEventListener("beforeunload", function () {
    saveRun();
  });

  let boardResizeFrame = 0;
  window.addEventListener("resize", function () {
    if (boardResizeFrame) cancelAnimationFrame(boardResizeFrame);
    boardResizeFrame = requestAnimationFrame(function () {
      boardResizeFrame = 0;
      layoutBoard();
    });
  });

  /* ---- boot ---- */

  function mountThemeMenu() {
    return GTC.themeMenu.mount({
      container: themeMenuEl,
      getThemeId: function () {
        return profile.settings.theme;
      },
      setThemeId: function (id) {
        profile.settings.theme = id;
        storage.saveProfile(profile);
      }
    });
  }

  function init() {
    themes.apply(profile.settings.theme);
    themes.applyCardBack(profile.settings.cardBack, data.cardBacks);
    themes.applyMotion(profile.settings.motion !== false);
    audio.setEnabled(profile.settings.sound !== false);
    if (gridEl) gridEl.textContent = "";
    mountThemeMenu();
    resumeSavedRun();
  }

  init();
})(window);
