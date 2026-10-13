import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';

const require = createRequire(import.meta.url);
const shim = (file) => fileURLToPath(new URL(`./src/lib/${file}`, import.meta.url));

// emojilib also ships keywords and categories (~250 kB) that only emoji search
// needs: build just the name → emoji table that :shortcodes: use
function emojiTable() {
	const id = 'virtual:emoji-table';
	return {
		name: 'emoji-table',
		resolveId: (source) => (source === id ? '\0' + id : undefined),
		load(moduleId) {
			if (moduleId !== '\0' + id) return;
			const { lib } = require('emojilib');
			const table = Object.entries(lib).map(([name, { char }]) => [name, char]);
			return `export default new Map(${JSON.stringify(table)});`;
		}
	};
}

export default {
	plugins: [sveltekit({ adapter: adapter() }), emojiTable()],
	resolve: {
		alias: {
			// markmap-lib bundles KaTeX (~270 kB) through @vscode/markdown-it-katex, yet
			// renders math with a copy it loads from a CDN on demand
			katex: shim('katex-shim.js'),
			// markmap-lib parses front matter with `yaml`; reuse the app's smaller js-yaml
			yaml: shim('yaml-shim.js')
		}
	}
};
