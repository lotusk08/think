// Stand-in for the `katex` package (aliased in vite.config.js). markmap replaces
// every math renderer of @vscode/markdown-it-katex with one that uses the KaTeX
// it loads from a CDN, so this only has to satisfy the import.
export default {
	renderToString: (latex, options) =>
		globalThis.katex ? globalThis.katex.renderToString(latex, options) : latex
};
