import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  "https://johavlaywmsjelumhirv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvaGF2bGF5d21zamVsdW1oaXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODMwNDQsImV4cCI6MjA5Mzc1OTA0NH0.rEtIZ-Pzk0paEb2wom6wG1jJ6Dej_u5FO_TIoNRygEg"
);

document.addEventListener("DOMContentLoaded", () => {
  const widgetBox = document.getElementById("widget-box");
  const previewWidget = document.getElementById("previewWidget");
  const grid = document.getElementById("mood-grid");

  const themeToggle = document.getElementById("themeToggle");
  const themeOptions = document.getElementById("themeOptions");
  const themeCircles = document.querySelectorAll(".theme-circle");

  const appearanceToggle = document.getElementById("appearanceToggle");
  const appearanceOptions = document.getElementById("appearanceOptions");
  const appearanceChoices = document.querySelectorAll(".appearance-option");

  const fontToggle = document.getElementById("fontToggle");
  const fontOptions = document.getElementById("fontOptions");
  const fontChoices = document.querySelectorAll(".font-option");

  const resetButton = document.getElementById("reset-button");
  const resetPopup = document.getElementById("reset-popup");
  const confirmReset = document.getElementById("confirm-reset");
  const cancelReset = document.getElementById("cancel-reset");

  const viewLogBtn = document.getElementById("view-log-btn");
  const moodLogPopup = document.getElementById("mood-log-popup");
  const logEntriesDiv = document.getElementById("log-entries");
  const closeLogBtn = document.getElementById("close-log-btn");

  const copyBtn = document.getElementById("copyLinkBtn");
  const copyMsg = document.getElementById("copyMessage");

  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get("embed") === "true";

  if (isEmbed) {
    document.documentElement.classList.add("embed-mode");
  }

  const state = {
    theme: params.get("theme") || localStorage.getItem("moodTheme") || "pink",
    font: params.get("font") || localStorage.getItem("moodFont") || "default",
    appearance:
      params.get("appearance") ||
      localStorage.getItem("moodAppearance") ||
      "system",
  };

  const widgetId =
    params.get("id") ||
    (crypto.randomUUID ? crypto.randomUUID() : `mood-${Date.now()}`);

  const themeColors = {
    pink: "#f4dfeb",
    green: "#ddedea",
    beige: "#faebdd",
    blue: "#ddebf1",
    black: "#17171a",
    white: "#f8f6f3",
  };

  const moods = [
    { color: "#FEF1C8", label: "good" },
    { color: "#FFA7A6", label: "loved" },
    { color: "#C3C2D5", label: "rough" },
    { color: "#C4DADE", label: "calm" },
    { color: "#93B0AC", label: "social" },
    { color: "#DCC3B4", label: "hectic" },
    { color: "#E7D9CC", label: "meh" },
    { color: "#FFA5C5", label: "awesome" },
  ];

  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  let moodLog = {};
  let moodMenu = null;

  function saveState() {
    localStorage.setItem("moodTheme", state.theme);
    localStorage.setItem("moodFont", state.font);
    localStorage.setItem("moodAppearance", state.appearance);
  }

  function updateBothWidgets(callback) {
    [widgetBox, previewWidget].forEach((widget) => {
      if (widget) callback(widget);
    });
  }

  function applyTheme(theme) {
    state.theme = theme || "pink";

    updateBothWidgets((widget) => {
      widget.classList.remove("pink", "green", "beige", "blue", "black", "white");
      widget.classList.add(state.theme);
    });

    if (themeToggle) {
      themeToggle.style.setProperty(
        "--theme-color",
        themeColors[state.theme] || themeColors.pink
      );
      themeToggle.style.backgroundColor =
        themeColors[state.theme] || themeColors.pink;
    }

    saveState();
  }

  function applyFont(font) {
    state.font = font || "default";

    const fontFamily =
      state.font === "serif"
        ? "Georgia, serif"
        : state.font === "mono"
        ? "ui-monospace, SFMono-Regular, Menlo, monospace"
        : "'Satoshi', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    updateBothWidgets((widget) => {
      widget.classList.remove("font-default", "font-serif", "font-mono");
      widget.classList.add(`font-${state.font}`);
      widget.style.fontFamily = fontFamily;
    });

    saveState();
  }

  function applyAppearance(appearance) {
    state.appearance = appearance || "system";

    document.body.classList.remove(
      "appearance-light",
      "appearance-dark",
      "appearance-system"
    );

    document.body.classList.add(`appearance-${state.appearance}`);

    saveState();
  }

  async function loadMoodLog() {
    const { data, error } = await supabase
      .from("mood_logs")
      .select("data")
      .eq("id", widgetId)
      .maybeSingle();

    if (error) {
      console.error("Supabase load error:", error);
      return;
    }

    if (data?.data) {
      moodLog = data.data;
      buildGrid();
    }
  }

  async function saveMood(key, mood) {
    moodLog[key] = mood;

    const { error } = await supabase
      .from("mood_logs")
      .upsert({
        id: widgetId,
        data: moodLog,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Supabase save error:", error);
    }
  }

  async function resetMoodLog() {
    moodLog = {};

    const { error } = await supabase
      .from("mood_logs")
      .upsert({
        id: widgetId,
        data: moodLog,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Supabase reset error:", error);
    }

    buildGrid();
  }

  function getWeekDates() {
    const today = new Date();
    const start = new Date(today);

    start.setDate(today.getDate() - today.getDay());
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return {
        day: days[i],
        key: d.toISOString().split("T")[0],
        date: d.getDate(),
      };
    });
  }

  function renderCell(cell, mood) {
    if (!cell) return;

    const content = cell.querySelector(".day-content");
    if (!content) return;

    content.innerHTML = "";

    if (!mood) {
      content.textContent = "+";
      content.style.background = "#f2f2f2";
      return;
    }

    content.style.background = mood.color;

    const label = document.createElement("span");
    label.textContent = mood.label;
    label.style.fontSize = "10px";
    label.style.opacity = "0.85";

    content.appendChild(label);
  }

  function closeMenus() {
    moodMenu?.remove();
    moodMenu = null;

    themeOptions?.classList.add("hidden");
    fontOptions?.classList.add("hidden");
    appearanceOptions?.classList.add("hidden");
    resetPopup?.classList.add("hidden");
    moodLogPopup?.classList.add("hidden");
  }

  function createMoodMenu(cell, key) {
    closeMenus();

    moodMenu = document.createElement("div");
    moodMenu.className = "mood-menu";

    moods.forEach((mood) => {
      const option = document.createElement("div");
      option.className = "mood-option";

      option.innerHTML = `
        <div class="mood-color" style="background:${mood.color}"></div>
        <div>${mood.label}</div>
      `;

      option.addEventListener("click", async (e) => {
        e.stopPropagation();

        renderCell(cell, mood);
        closeMenus();

        await saveMood(key, mood);
      });

      moodMenu.appendChild(option);
    });

    widgetBox.appendChild(moodMenu);
  }

  function buildGrid() {
    if (!grid) return;

    grid.innerHTML = "";

    getWeekDates().forEach(({ key, day, date }) => {
      const cell = document.createElement("div");

      cell.className = "day-cell";
      cell.dataset.key = key;

      cell.innerHTML = `
        <div class="day-label">
          ${day}
          <span class="day-date">${date}</span>
        </div>
        <div class="day-content"></div>
      `;

      renderCell(cell, moodLog[key]);

      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        createMoodMenu(cell, key);
      });

      grid.appendChild(cell);
    });
  }

  themeToggle?.addEventListener("click", (e) => {
    e.stopPropagation();

    themeOptions?.classList.toggle("hidden");
    fontOptions?.classList.add("hidden");
    appearanceOptions?.classList.add("hidden");
  });

  themeCircles.forEach((circle) => {
    circle.addEventListener("click", (e) => {
      e.stopPropagation();

      applyTheme(circle.dataset.theme);
      themeOptions?.classList.add("hidden");
    });
  });

  appearanceToggle?.addEventListener("click", (e) => {
    e.stopPropagation();

    appearanceOptions?.classList.toggle("hidden");
    themeOptions?.classList.add("hidden");
    fontOptions?.classList.add("hidden");
  });

  appearanceChoices.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();

      applyAppearance(option.dataset.appearance);
      appearanceOptions?.classList.add("hidden");
    });
  });

  fontToggle?.addEventListener("click", (e) => {
    e.stopPropagation();

    fontOptions?.classList.toggle("hidden");
    themeOptions?.classList.add("hidden");
    appearanceOptions?.classList.add("hidden");
  });

  fontChoices.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();

      applyFont(option.dataset.font);
      fontOptions?.classList.add("hidden");
    });
  });

  resetButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    resetPopup?.classList.remove("hidden");
  });

  confirmReset?.addEventListener("click", async (e) => {
    e.stopPropagation();

    await resetMoodLog();

    resetPopup?.classList.add("hidden");
  });

  cancelReset?.addEventListener("click", (e) => {
    e.stopPropagation();
    resetPopup?.classList.add("hidden");
  });

  viewLogBtn?.addEventListener("click", (e) => {
    e.stopPropagation();

    if (!logEntriesDiv || !moodLogPopup) return;

    logEntriesDiv.innerHTML = "";

    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const totalDays = 365;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(yearStart);
      d.setDate(yearStart.getDate() + i);

      const key = d.toISOString().split("T")[0];
      const mood = moodLog[key];

      const cell = document.createElement("div");
      cell.className = "year-cell";

      if (mood) {
        cell.style.background = mood.color;
        cell.title = `${key} → ${mood.label}`;
      } else {
        cell.style.background = "#f2f2f2";
        cell.title = `${key} → no mood`;
      }

      logEntriesDiv.appendChild(cell);
    }

    moodLogPopup.classList.remove("hidden");
  });

  closeLogBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    moodLogPopup?.classList.add("hidden");
  });

  copyBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();

    const url =
      `${location.origin}${location.pathname}` +
      `?id=${encodeURIComponent(widgetId)}` +
      `&theme=${encodeURIComponent(state.theme)}` +
      `&font=${encodeURIComponent(state.font)}` +
      `&appearance=${encodeURIComponent(state.appearance)}` +
      `&embed=true`;

    await navigator.clipboard.writeText(url);

    copyMsg?.classList.remove("hidden");
    copyMsg?.classList.add("show");

    clearTimeout(window.__copyTimer);
    window.__copyTimer = setTimeout(() => {
      copyMsg?.classList.add("hidden");
      copyMsg?.classList.remove("show");
    }, 1500);
  });

  document.addEventListener("click", closeMenus);

  applyTheme(state.theme);
  applyFont(state.font);
  applyAppearance(state.appearance);
  buildGrid();
  loadMoodLog();
});
