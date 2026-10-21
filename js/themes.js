/* Guess the Cell — theme and card-back engine. */
(function (global) {
  "use strict";

  const THEMES = [
    {
      id: "pastel",
      name: "Pastel",
      accent: "#7fbf95",
      swatches: ["#c8e6d0", "#dcd3f0", "#fbd9c8", "#f5eac3"]
    },
    {
      id: "midnight",
      name: "Midnight",
      accent: "#7aa2ff",
      swatches: ["#1b2136", "#31406b", "#7aa2ff", "#f7a8bd"]
    },
    {
      id: "sunset",
      name: "Sunset",
      accent: "#ff8a5b",
      swatches: ["#ffe3d3", "#ffb088", "#ff8a5b", "#f770a8"]
    },
    {
      id: "ocean",
      name: "Ocean",
      accent: "#2eb3d6",
      swatches: ["#d7f1fb", "#7ed3ea", "#2eb3d6", "#0e6f8c"]
    },
    {
      id: "forest",
      name: "Forest",
      accent: "#7fb069",
      swatches: ["#e0ecd4", "#b6d7a8", "#7fb069", "#b5651d"]
    }
  ];

  function byId(id) {
    for (let i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return THEMES[i];
    }
    return THEMES[0];
  }

  function apply(themeId) {
    const theme = byId(themeId);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme.id);
    return theme;
  }

  function applyCardBack(backId, cardBacks) {
    const id = cardBacks && cardBacks[backId] ? backId : "cell";
    document.documentElement.setAttribute("data-cardback", id);
    return id;
  }

  function applyMotion(enabled) {
    document.documentElement.setAttribute("data-motion", enabled ? "on" : "off");
  }

  global.GTC = global.GTC || {};
  global.GTC.themes = {
    THEMES: THEMES,
    byId: byId,
    apply: apply,
    applyCardBack: applyCardBack,
    applyMotion: applyMotion
  };
})(window);
