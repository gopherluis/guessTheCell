/* Guess the Cell — tiny WebAudio sound engine.
   No asset files: every effect is a short synthesised tone. */
(function (global) {
  "use strict";

  let ctx = null;
  let enabled = true;

  function ensureContext() {
    if (ctx) return ctx;
    const Ctor = global.AudioContext || global.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch (err) {
      ctx = null;
    }
    return ctx;
  }

  function resume() {
    const audio = ensureContext();
    if (audio && audio.state === "suspended") audio.resume();
    return audio;
  }

  function tone(options) {
    if (!enabled) return;
    const audio = resume();
    if (!audio) return;

    const start = audio.currentTime + (options.delay || 0);
    const duration = options.duration || 0.12;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(options.frequency, start);
    if (options.slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, options.slideTo),
        start + duration
      );
    }

    const peak = options.gain === undefined ? 0.16 : options.gain;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function chord(frequencies, options) {
    frequencies.forEach(function (frequency, index) {
      tone({
        frequency: frequency,
        type: options && options.type ? options.type : "triangle",
        duration: options && options.duration ? options.duration : 0.18,
        gain: options && options.gain ? options.gain / frequencies.length : 0.05,
        delay: (options && options.delay ? options.delay : 0) + index * 0.06
      });
    });
  }

  const effects = {
    flip: function () {
      tone({ frequency: 380, slideTo: 620, type: "sine", duration: 0.1, gain: 0.09 });
    },
    match: function () {
      chord([523.25, 659.25, 783.99], { duration: 0.2, gain: 0.13 });
    },
    correct: function () {
      chord([659.25, 987.77], { duration: 0.22, gain: 0.14 });
    },
    wrong: function () {
      tone({ frequency: 240, slideTo: 120, type: "sawtooth", duration: 0.28, gain: 0.09 });
    },
    shuffle: function () {
      tone({ frequency: 300, slideTo: 720, type: "triangle", duration: 0.32, gain: 0.07 });
    },
    streak: function () {
      chord([783.99, 1046.5, 1318.51], { duration: 0.22, gain: 0.15 });
    },
    win: function () {
      chord([523.25, 659.25, 783.99, 1046.5], { duration: 0.3, gain: 0.17 });
    },
    tick: function () {
      tone({ frequency: 900, type: "sine", duration: 0.04, gain: 0.04 });
    }
  };

  function play(name) {
    if (!enabled) return;
    const effect = effects[name];
    if (effect) effect();
  }

  function setEnabled(value) {
    enabled = !!value;
    if (enabled) resume();
  }

  global.GTC = global.GTC || {};
  global.GTC.audio = {
    play: play,
    setEnabled: setEnabled,
    isEnabled: function () { return enabled; },
    unlock: resume
  };
})(window);
