// Stand-in for the `katex` package (aliased in vite.config.js). Every math renderer
// is routed to markmap's on-demand CDN copy (see Mindmap.svelte), so this is only
// a fallback that uses that copy once it is loaded.
export default {
	renderToString: (latex, options) =>
		globalThis.katex ? globalThis.katex.renderToString(latex, options) : latex
};
