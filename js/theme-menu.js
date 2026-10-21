/* Guess the Cell — theme settings menu.
   A gear button that opens a small panel with the theme swatches. The landing
   header and the game HUD share it, so the theme is reachable from both
   without a permanently visible picker. */
(function (global) {
  "use strict";

  const GTC = global.GTC;
  const themes = GTC.themes;

  const GEAR_ICON = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"',
    ' stroke-linecap="round" aria-hidden="true" focusable="false">',
    '<circle cx="12" cy="12" r="6.4" />',
    '<circle cx="12" cy="12" r="2.3" />',
    '<path d="M12 2.6v3.2" />',
    '<path d="M12 2.6v3.2" transform="rotate(45 12 12)" />',
    '<path d="M12 2.6v3.2" transform="rotate(90 12 12)" />',
    '<path d="M12 2.6v3.2" transform="rotate(135 12 12)" />',
    '<path d="M12 2.6v3.2" transform="rotate(180 12 12)" />',
    '<path d="M12 2.6v3.2" transform="rotate(225 12 12)" />',
    '<path d="M12 2.6v3.2" transform="rotate(270 12 12)" />',
    '<path d="M12 2.6v3.2" transform="rotate(315 12 12)" />',
    "</svg>"
  ].join("");

  let instanceCount = 0;

  /* ---- swatch chips ---- */

  function renderPicker(picker, activeId, onSelect) {
    picker.innerHTML = "";
    themes.THEMES.forEach(function (theme) {
      const active = theme.id === activeId;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-chip";
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", active ? "true" : "false");
      button.setAttribute("aria-label", "Use the " + theme.name + " theme");
      button.title = theme.name;
      button.setAttribute("data-theme-id", theme.id);
      button.tabIndex = active ? 0 : -1;
      button.classList.toggle("is-active", active);
      button.innerHTML =
        '<span class="theme-swatches">' +
        theme.swatches
          .map(function (color) {
            return '<span class="theme-swatch" style="background:' + color + '"></span>';
          })
          .join("") +
        "</span>";
      button.addEventListener("click", function () {
        onSelect(theme.id);
      });
      picker.appendChild(button);
    });
  }

  /* ---- menu ---- */

  function mount(options) {
    const container = options.container;
    if (!container) return null;

    const getThemeId = options.getThemeId || function () {
      return themes.THEMES[0].id;
    };
    const setThemeId = options.setThemeId || function () {};
    const nameEl = options.nameEl || null;

    instanceCount += 1;
    const panelId = "theme-menu-panel-" + instanceCount;

    container.classList.add("theme-menu");
    container.innerHTML =
      '<button type="button" class="icon-btn" aria-expanded="false"' +
      ' aria-controls="' + panelId + '" aria-label="Settings">' +
      GEAR_ICON +
      "</button>" +
      '<div class="theme-menu-panel" id="' + panelId + '" role="group" aria-label="Theme">' +
      '<div class="theme-menu-head">' +
      '<span class="chip-label">Theme</span>' +
      '<span class="theme-menu-current"></span>' +
      "</div>" +
      '<div class="chip-row theme-menu-picker" role="radiogroup" aria-label="Colour theme"></div>' +
      "</div>";

    const button = container.querySelector(".icon-btn");
    const panel = container.querySelector(".theme-menu-panel");
    const picker = container.querySelector(".theme-menu-picker");
    const currentEl = container.querySelector(".theme-menu-current");

    const menu = {
      element: container,
      button: button,
      panel: panel,

      select: function (id) {
        setThemeId(id);
        themes.apply(id);
        menu.render();
      },

      render: function () {
        const activeId = themes.byId(getThemeId()).id;
        const focused = document.activeElement;
        const focusedId = picker.contains(focused)
          ? focused.getAttribute("data-theme-id")
          : null;
        renderPicker(picker, activeId, function (id) {
          menu.select(id);
        });
        if (currentEl) currentEl.textContent = themes.byId(activeId).name;
        if (nameEl) nameEl.textContent = themes.byId(activeId).name;
        if (focusedId) {
          const restored = picker.querySelector('[data-theme-id="' + focusedId + '"]');
          if (restored) restored.focus();
        }
      },

      place: function () {
        const margin = 8;
        const box = container.getBoundingClientRect();
        const width = panel.offsetWidth;
        let left = box.right - width;
        if (left + width > window.innerWidth - margin) {
          left = window.innerWidth - width - margin;
        }
        if (left < margin) left = margin;
        panel.style.right = "auto";
        panel.style.left = Math.round(left - box.left) + "px";
      },

      open: function () {
        panel.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        menu.place();
      },

      close: function () {
        panel.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
      },

      isOpen: function () {
        return panel.classList.contains("is-open");
      }
    };

    button.addEventListener("click", function () {
      if (menu.isOpen()) {
        menu.close();
      } else {
        menu.open();
      }
    });

    /* Keyboard: arrows walk the swatches, escape closes and restores focus. */
    picker.addEventListener("keydown", function (event) {
      const step =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (!step) return;
      event.preventDefault();
      const chips = picker.querySelectorAll(".theme-chip");
      const index = Array.prototype.indexOf.call(chips, document.activeElement);
      const next = chips[(index + step + chips.length) % chips.length];
      next.focus();
      menu.select(next.getAttribute("data-theme-id"));
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.isOpen()) {
        menu.close();
        button.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!menu.isOpen()) return;
      if (container.contains(event.target)) return;
      menu.close();
    });

    window.addEventListener("resize", function () {
      if (menu.isOpen()) menu.place();
    });

    menu.render();
    return menu;
  }

  global.GTC = global.GTC || {};
  global.GTC.themeMenu = {
    mount: mount,
    renderPicker: renderPicker
  };
})(window);
