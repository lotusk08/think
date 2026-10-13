import { parse } from "./yaml-shim.js";

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", Inter, Ubuntu, "Liberation Sans", sans-serif, "Source Code Pro", "SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace';

// Styles for the `theme:` header option.
// Since markmap 0.18, data-depth starts at 1 for the root node (not 0).
const THEME_STYLES = {
	focus: 'line, path, circle{stroke-width:3} g[data-depth="1"] circle, g[data-depth="2"] circle{r:7} g[data-depth="3"] circle{r:3} circle {r:1} g[data-depth="1"] line, g[data-depth="2"] line, path[data-depth="2"], circle{stroke-width:10} g[data-depth="1"] circle {fill:var(--mindmap-primary-color)} g[data-depth="3"] line, path[data-depth="3"], g[data-depth="2"] circle{stroke-width:6} div{padding-bottom:0.2em!important; padding-top:0.2em; font-family:' + fontStack + '} g[data-depth="1"] div div{border:2px solid var(--mindmap-primary-color);border-radius:5px; padding-left:0.5em; margin-left:-1.3em; padding-top:0.35em;padding-right:0.75em} g[data-depth="2"] div > span {background-color:var(--mindmap-secondary-bg); padding:0.3em 0.5em; margin-top:-0.35em; margin-left:-1em; border-radius:5px;} div{font-family:' + fontStack + ';} g[data-depth="3"] div{margin-left:-0.25em;} svg div{margin-top:-4px} img{height:4em; display:block;}',
	nolines: 'line {stroke:transparent} g[data-depth="1"] line{stroke:var(--mindmap-primary-color); stroke-width:4} g div div {margin-top:12px;} g[data-depth="1"] div div{border:2px solid var(--mindmap-primary-color); margin-left:-1.4em; background-color:var(--bg-color); margin-top:12px; padding:0.5em; text-align:center; border-radius:7px} g[data-depth="1"] div > span {display:inline!important;} circle{r:4} g[data-depth="1"]:not(.markmap-fold) circle{r:0} path{stroke-width:2.5;} path[data-depth="1"],path[data-depth="2"]{stroke-width:4;}',
	black: 'line, path, circle{stroke:var(--text-color)} g[data-depth="1"] line{stroke-width:8} g[data-depth="2"] line, path[data-depth="2"]{stroke-width:4} g[data-depth="3"] line, path[data-depth="3"]{stroke-width:2} circle{r:4} g[data-depth="1"] circle{r:6} circle:not([fill="var(--markmap-circle-open-bg)"]){fill:var(--text-color); stroke:transparent;}'
};

// Extra room under each branch so KaTeX formulas are not clipped
// (the focus theme already has it)
const MATH_PADDING = "div{padding-bottom:0.2em!important;}";

const DEFAULTS = {
	title: "", // unset: callers pick their own fallback
	style: "",
	initialExpandLevel: -1,
	openLinksInNewTab: false,
	focusOnBranch: false,
	automaticResize: true,
	showMenu: true,
	disableWarningMessage: false
};

// Every key the YAML header understands (also highlighted by the editor)
export const OPTION_KEYS = [...Object.keys(DEFAULTS), "theme", "maxWidth", "mw", "colorFreezeLevel", "curves"];

// Reads the YAML front matter the same way markmap does: only at the very start.
// Returns null when it is malformed (e.g. while being typed), so callers can keep
// the previous options instead of flickering through the defaults.
function readFrontMatter(markdown) {
	if (!/^---\r?\n/.test(markdown)) return undefined;
	// An opened header that is not closed yet is still being typed
	const end = /\n---(?:\r?\n|$)/.exec(markdown);
	if (!end) return null;
	try {
		const data = parse(markdown.slice(4, end.index));
		return data && typeof data === "object" && !Array.isArray(data) ? data : {};
	} catch (e) {
		console.error("Error parsing YAML:", e);
		return null;
	}
}

export function parseOptions(markdown) {
	const yaml = readFrontMatter(markdown);
	if (yaml === null) return null;

	const options = {};
	for (const key in DEFAULTS) options[key] = yaml?.[key] ?? DEFAULTS[key];

	const theme = yaml?.theme ?? "";
	const compact = theme === "focus" || theme === "nolines";
	if (Object.hasOwn(THEME_STYLES, theme)) {
		options.style = THEME_STYLES[theme] + " " + options.style;
	}
	if (theme !== "focus" && markdown.includes("$")) {
		options.style = MATH_PADDING + " " + options.style;
	}

	// Without any header the map keeps markmap's own palette (colorFreezeLevel 0)
	const defaultFreezeLevel = !yaml || theme === "black" ? 0 : compact ? 2 : 100;
	options.maxWidth = yaml?.maxWidth ?? yaml?.mw ?? (compact ? 250 : 500);
	options.colorFreezeLevel = yaml?.colorFreezeLevel ?? defaultFreezeLevel;
	options.curves = yaml?.curves ?? theme !== "black";
	return options;
}
