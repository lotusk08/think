import { load } from "js-yaml";

// Stand-in for the `yaml` package (aliased in vite.config.js), which markmap-lib
// only uses to parse front matter: the app's js-yaml is roughly half its size.
// Also the app's own header parser, so both read headers the same way.
// Like yaml's parse, an empty or comment-only document is null (js-yaml throws).
export function parse(text) {
	return text.replace(/^\s*#.*$/gm, "").trim() ? load(text) : null;
}
