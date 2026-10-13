import { writable, get } from "svelte/store";
import { initialDemoContent } from "./content.js";

const THEME_KEY = "theme";
const THEME_COLORS = { light: "#FCFCF9", dark: "#1a1a1a" };

// Storage can throw (private browsing, blocked site data): treat it as empty
function readSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function saveTheme(value) {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {}
}

// app.html sets data-theme before first paint; this store owns it afterwards.
// A theme picked with the toggle is remembered; until then, follow the system.
function createThemeStore() {
  const store = writable("light");
  if (typeof window === "undefined") {
    return { subscribe: store.subscribe, toggle() {} };
  }

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const systemTheme = () => (systemDark.matches ? "dark" : "light");

  function apply(value) {
    document.documentElement.setAttribute("data-theme", value);
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", THEME_COLORS[value]);
    }
    store.set(value);
  }

  apply(readSavedTheme() || systemTheme());
  systemDark.addEventListener("change", () => {
    if (!readSavedTheme()) apply(systemTheme());
  });

  return {
    subscribe: store.subscribe,
    toggle() {
      const next = get(store) === "light" ? "dark" : "light";
      saveTheme(next);
      apply(next);
    },
  };
}

export const theme = createThemeStore();
export const show = writable(false);
export const markdownSource = writable(initialDemoContent);
// One-shot file export requested from the menu ("svg" or "html"), handled
// (and reset) by Mindmap.svelte. PDF goes through the browser's print dialog.
export const exportRequest = writable(null);
