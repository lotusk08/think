<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { emojify } from '../lib/emoji.js';
	import Menu from '../lib/Menu.svelte';
	import Editor from '../lib/Editor.svelte';
	import Mindmap from '../lib/Mindmap.svelte';
	import { markdownSource } from '../lib/stores.js';
	import { parseOptions } from '../lib/options.js';
	import { replaceMarkdown } from '../lib/markdown.js';
	import { toFetchableURL } from '../lib/remote.js';

	let mindmapFromURL = false;

	// Don't flash the demo map while a map given in the URL loads
	const hash = browser ? location.hash.slice(1) : '';
	if (hash) {
		markdownSource.set('');
	}

	onMount(async () => {
		if (hash.startsWith('http')) {
			const response = await fetch(toFetchableURL(hash));
			markdownSource.set(await response.text());
			mindmapFromURL = true;
		} else if (hash) {
			markdownSource.set(decodeURI(hash));
			// The map now lives in the editor: drop it from the address bar
			goto(location.pathname + location.search, { shallow: true });
			mindmapFromURL = true;
		}
	});

	// A malformed header (e.g. while it is being typed) keeps the previous options
	let options = parseOptions('');
	$: options = parseOptions($markdownSource) ?? options;
	$: ({ showMenu, disableWarningMessage, ...mindmapOptions } = options);
	$: mindmapSource = replaceMarkdown(emojify($markdownSource));
</script>

<Menu {showMenu} {disableWarningMessage} />

<main>
	<Editor />
	<!-- Recreated once a map from the URL is in, so it is laid out and fitted afresh -->
	{#key mindmapFromURL}
		<Mindmap source={mindmapSource} {...mindmapOptions} />
	{/key}
</main>

<style>
	:global(body) {
		overflow:hidden;
	}
</style>
