import { sveltekit } from '@sveltejs/kit/vite';

// The output directory is controlled by adapter-static in svelte.config.js:
// setting build.outDir here is overridden by SvelteKit.
const config = {
	plugins: [sveltekit()]
};

export default config;
