<script>
	import { onDestroy } from 'svelte';
	import { Transformer } from 'markmap-lib';
	import * as markmap from 'markmap-view';
	import { saveAs } from './saveAs.js';
	import { escapeHtml } from './markdown.js';
	import { motionMs } from './motion.js';
	import {
		exportRequest,
		markdownSource,
		show,
		theme
	} from './stores.js';

	export let source;
	export let maxWidth;
	export let style;
	export let title;
	export let colorFreezeLevel;
	export let initialExpandLevel;
	export let openLinksInNewTab;
	export let curves;
	export let focusOnBranch;
	export let automaticResize;

	const { Markmap, loadCSS, loadJS, deriveOptions } = markmap;
	const isMobile = typeof navigator !== 'undefined' &&
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
	// On mobile, resizing starts off: a double tap turns it on
	if (isMobile) {
		automaticResize = false;
	}

	let mindmap; // the <svg>
	let mm; // the Markmap instance
	let transformer;
	let titleElement;
	let styleElement;
	let mindmapRoot;
	let renderId = 0;
	let retransformQueued = false;
	let lastTapTime = 0;

	const IMAGE_HEIGHTS = [25, 50, 75, 100, 125, 150, 175, 200];

	// markmap ships its own light-only palette on .markmap: remap it onto the
	// app theme so text stays readable in dark mode
	const MARKMAP_PALETTE = `
		svg#markmap {
			--markmap-text-color: var(--text-color);
			--markmap-code-bg: var(--mindmap-code-bg);
			--markmap-code-color: var(--mindmap-code-color);
			--markmap-circle-open-bg: var(--bg-color);
			--markmap-table-border: 1px solid var(--border-color);
		}
		.markmap-foreign code {
			color: var(--mindmap-code-color) !important;
			background-color: var(--mindmap-code-bg) !important;
		}`;

	// Node content styles shared by the live map and the HTML export,
	// with every selector prefixed by `scope`
	function contentCSS(scope) {
		const narrow = maxWidth < 250;
		return `
			${scope}a {text-decoration:none}
			${scope}foreignObject {overflow:visible}
			${scope}.hide, ${scope}.hide * {color:var(--text-color)!important; opacity:0.2}
			${scope}.hide {background-color:var(--mindmap-hide-bg); border-radius:1px; transition:opacity 0.2s ease}
			${scope}.hide:hover {opacity:0.8}
			${scope}.hide img {opacity:0}
			${IMAGE_HEIGHTS.map((h) => `${scope}img[alt=h-${h}]{height:${h}px}`).join('\n')}
			${scope}blockquote {
				width:${narrow ? maxWidth : 250}px!important;
				white-space:normal;
				text-align:justify;
				font-size:0.8em;
				line-height:1em;
				border:1px solid var(--mindmap-blockquote-border);
				padding:10px;
				border-radius:4px;
				${narrow ? 'margin-left:-10px;' : ''}
			}
			${scope}cite {font-style:inherit; font-family:serif; font-size:0.97em}
			${scope}code, .markmap-foreign code {
				color:var(--mindmap-code-color);
				background-color:var(--mindmap-code-bg);
				border-radius:var(--code-border-radius);
				padding:var(--code-padding);
				font-size:var(--code-font-size);
			}
			.markmap-foreign>div {
				width:max-content!important;
				max-width:var(--markmap-max-width)!important;
			}
			/* Forces KaTeX rendering in HTML tags */
			${scope}g[data-depth="1"] div > span br:nth-of-type(1), ${scope}g[data-depth="2"] div > span br:nth-of-type(1){display:none}
		`;
	}

	function liveCSS() {
		return MARKMAP_PALETTE + `
			svg div{margin-top:-2px;}
			svg strong{font-size:0.95em; font-weight:600;}
			svg aside{font-size:0.8em; display:inline-block; font-weight:normal; vertical-align:top}
		` + contentCSS('svg ') + style;
	}

	function branchColors() {
		return getComputedStyle(document.documentElement)
			.getPropertyValue('--mindmap-branch-colors')
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
	}

	function markmapOptions() {
		const options = {
			maxWidth,
			spacingVertical: 15,
			paddingX: 20,
			autoFit: false,
			initialExpandLevel,
			paddingY: 20
		};
		return colorFreezeLevel > 0
			? { ...options, ...deriveOptions({ color: branchColors(), colorFreezeLevel }) }
			: options;
	}

	function createTransformer() {
		const created = new Transformer();
		const { rules } = created.md.renderer;
		// markmap sends $…$ and block $$…$$ to its on-demand KaTeX, but leaves inline
		// $$…$$ to the bundled one, which is stubbed out (see vite.config.js)
		rules.math_inline_block = rules.math_block;
		// KaTeX and highlight.js come from a CDN on first use: render again once
		// they are in (one call per pending formula, so coalesce them)
		created.hooks.retransform.tap(() => {
			if (retransformQueued) return;
			retransformQueued = true;
			queueMicrotask(() => {
				retransformQueued = false;
				render();
			});
		});
		return created;
	}

	async function render() {
		if (!mindmap) return;
		const id = ++renderId;
		transformer ??= createTransformer();

		const { root, features } = transformer.transform(source);
		const { styles, scripts } = transformer.getUsedAssets(features);
		await loadCSS(styles);
		await loadJS(scripts, { getMarkmap: () => markmap });
		// A newer render started while the assets loaded
		if (id !== renderId || !mindmap) return;

		mindmapRoot = root;
		if (!mm) {
			titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
			styleElement = document.createElement('style');
			styleElement.id = 'mindmap-style';
			mindmap.append(titleElement, styleElement);
		}
		titleElement.textContent = title;
		// Restyling the whole page on every keystroke is costly: only when it changed
		const css = liveCSS();
		if (styleElement.textContent !== css) {
			styleElement.textContent = css;
		}

		const created = !mm;
		mm ??= new Markmap(mindmap, markmapOptions());
		await instantly(async () => {
			// setData is async: fit only once the new layout has been rendered,
			// otherwise the zoom transform is computed from a stale/empty rect
			await mm.setData(root, markmapOptions());
			if (created || automaticResize) mm.fit();
		});
	}

	// Folding, unfolding and refitting animate; re-renders while typing (or
	// recolouring) are instant so the map never lags behind the editor
	async function instantly(task) {
		mm.options.duration = 0;
		try {
			await task();
		} finally {
			mm.options.duration = motionMs(300);
		}
	}

	$: if (mindmap) render(source, maxWidth, style, title, colorFreezeLevel, initialExpandLevel);

	// Branch colors come from the theme: recolor (without refitting) when it changes
	const unsubscribeTheme = theme.subscribe(() => {
		if (mm && colorFreezeLevel > 0) instantly(() => mm.setData(null, markmapOptions()));
	});

	// `curves: false`: markmap only draws curves, so straighten every link path it
	// (re)draws: on data changes, folding, and when node contents get resized
	const straightener = typeof MutationObserver === 'undefined' ? null : new MutationObserver((records) => {
		for (const { target } of records) straighten(target);
	});

	function straighten(path) {
		const d = path.getAttribute('d');
		if (d && d.includes('C')) {
			path.setAttribute('d', d.replace('C', 'L'));
		}
	}

	$: if (mindmap && straightener) {
		straightener.disconnect();
		if (curves === false) {
			mindmap.querySelectorAll('path').forEach(straighten);
			straightener.observe(mindmap, { subtree: true, attributeFilter: ['d'] });
		}
	}

	onDestroy(() => {
		unsubscribeTheme();
		straightener?.disconnect();
		mm?.destroy();
	});

	function fitSoon() {
		if (automaticResize) {
			setTimeout(() => mm.fit(), 50);
		}
	}

	function toggleAutomaticResize() {
		automaticResize = !automaticResize;
		fitSoon();
	}

	function handleDoubleTap(event) {
		if (!isMobile) return false;
		const now = Date.now();
		const tapLength = now - lastTapTime;
		lastTapTime = now;
		if (tapLength > 0 && tapLength < 500) {
			event.preventDefault();
			toggleAutomaticResize();
			return true;
		}
		return false;
	}

	// Keeps only the clicked branch open among its siblings
	function focusBranch(circle) {
		const path = circle.parentElement.getAttribute('data-path');
		const lastDot = path.lastIndexOf('.');
		const parentPath = lastDot === -1 ? path : path.slice(0, lastDot);
		const unfoldedBranches = mindmap.querySelectorAll(`g[data-path^="${parentPath}."]:not(.markmap-fold)`);
		for (const branch of unfoldedBranches) {
			branch.querySelector('circle')?.dispatchEvent(new MouseEvent('click'));
		}
		if ((!focusOnBranch || unfoldedBranches.length > 0) && path != '1') {
			circle.dispatchEvent(new MouseEvent('click'));
		}
	}

	function handleClick(event) {
		if (handleDoubleTap(event)) {
			return;
		}

		const { target } = event;
		// Command key on Mac, Alt key on Windows/Linux
		const modifierKeyPressed = isMac ? event.metaKey : event.altKey;

		// Set before the browser follows the link
		if (openLinksInNewTab) {
			target.closest('a')?.setAttribute('target', '_blank');
		}

		if (target.tagName === 'circle') {
			if (modifierKeyPressed || focusOnBranch) {
				focusBranch(target);
			}
		} else {
			// Modifier+click hides the branch text, a plain click shows it again
			const textElement = target.closest('div');
			if (textElement && mindmap.contains(textElement)) {
				if (modifierKeyPressed) {
					textElement.classList.toggle('hide');
				} else {
					textElement.classList.remove('hide');
				}
			}
		}
		fitSoon();
	}

	function handleKeydown(event) {
		if (!$show && event.key === 'r' && !event.metaKey && !event.ctrlKey && !event.altKey) {
			toggleAutomaticResize();
		}
	}

	// Data inside a <script> must not be able to close it
	function toScriptJSON(value) {
		return JSON.stringify(value).replace(/</g, '\\u003c');
	}

	function createSVG() {
		const { x, y, width, height } = mindmap.getBBox();
		const content = mindmap.innerHTML
			.replace(/<br>/g, '<br/>')
			.replace(/\n/g, ' ')
			.replace(/<title>.*<\/title>/, '')
			// Without xmlns on the divs, the text is not visible in the saved SVG
			.replaceAll('<div>', '<div xmlns="http://www.w3.org/1999/xhtml">');
		return '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">' +
			`<svg id="markmap" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="${mindmap.className.baseVal}" style="width:100%; height:100%;" viewBox="${x - 20} ${y - 20} ${width + 40} ${height + 40}">` +
			`<use xlink:href=""><title>${escapeHtml(String(title))}</title></use>` +
			`<desc>${escapeHtml($markdownSource)}</desc>` +
			content +
			'</svg>';
	}

	function createHTML() {
		const escapedTitle = escapeHtml(String(title));
		const styles = `
			div{padding-bottom:0.12em!important}
			strong{color:var(--text-color); font-size:0.95em!important; font-weight:600!important;}
			aside{font-size:0.8em; display:inline-block!important; font-weight:normal; vertical-align:top}
			${contentCSS('')}
			.katex-html{display:none}
			${style}
		`;
		return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>${escapedTitle}</title>
	<style>
		:root {
			--mindmap-code-bg: #f5f5f5;
			--mindmap-code-color: #333;
			--mindmap-blockquote-border: #aaa;
			--mindmap-hide-bg: rgba(200, 200, 200, 0.85);
			--text-color: #494949;
			--bg-color: #fcfcf9;
			--border-color: #e0e0e0;
			--code-padding: 0.25em;
			--code-font-size: calc(1em - 2px);
			--code-border-radius: 2px;
		}
		@media (prefers-color-scheme: dark) {
			:root {
				--mindmap-code-bg: #2d2d2d;
				--mindmap-code-color: #e0e0e0;
				--mindmap-blockquote-border: #555;
				--mindmap-hide-bg: rgba(80, 80, 80, 0.85);
				--text-color: #e7e7e7;
				--bg-color: #1a1a1a;
				--border-color: #404040;
			}
		}
		* { margin:0; padding:0 }
		body { background-color: var(--bg-color); color: var(--text-color); }
		#markmap { display:block; width:100vw; height:100vh }
		${MARKMAP_PALETTE}
	</style>
</head>
<body>
	<svg id="markmap">
		<use xlink:href=""><title>${escapedTitle}</title></use>
		<desc>${escapeHtml($markdownSource)}</desc>
	</svg>
	<script src="https://cdn.jsdelivr.net/npm/d3@7"><\/script>
	<script src="https://cdn.jsdelivr.net/npm/markmap-view@0.18"><\/script>
	<script>
		const { Markmap, deriveOptions } = window.markmap;
		const styles = ${toScriptJSON(styles)};
		const options = {
			duration: 0,
			style: () => styles,
			maxWidth: ${toScriptJSON(maxWidth)},
			spacingVertical: 8,
			paddingX: 15,
			autoFit: true
		};
		const colorFreezeLevel = ${toScriptJSON(colorFreezeLevel)};
		const colorOptions = colorFreezeLevel > 0
			? deriveOptions({ color: ${toScriptJSON(branchColors())}, colorFreezeLevel })
			: {};
		Markmap.create("#markmap", { ...options, ...colorOptions }, ${toScriptJSON(mindmapRoot)});
	<\/script>
</body>
</html>`;
	}

	function saveFile(content, name) {
		saveAs(new File([content], name, { type: 'text/plain;charset=utf-8' }));
	}

	const fileExports = {
		svg: () => saveFile(createSVG(), 'mindmap.svg'),
		html: () => saveFile(createHTML(), 'mindmap.html')
	};

	$: if ($exportRequest) {
		fileExports[$exportRequest]();
		exportRequest.set(null);
	}

	// Print / Save as PDF (from the menu or Cmd/Ctrl+P): fit the whole map on one
	// page, oriented to suit its shape, then put the view back as it was
	let printState;

	function handleBeforePrint() {
		// Already laid out for print (beforeprint can fire again before afterprint)
		if (!mm || printState) return;
		const group = mm.g.node();
		const { x, y, width, height } = group.getBBox();
		const margin = 20;
		const pageStyle = document.createElement('style');
		pageStyle.textContent = `@page { size: ${width >= height ? 'landscape' : 'portrait'}; margin: 10mm; }`;
		document.head.append(pageStyle);
		printState = { transform: group.getAttribute('transform'), documentTitle: document.title, pageStyle };

		group.removeAttribute('transform');
		mindmap.setAttribute('viewBox', `${x - margin} ${y - margin} ${width + 2 * margin} ${height + 2 * margin}`);
		// Browsers name the PDF after the page title
		document.title = String(title);
	}

	function handleAfterPrint() {
		if (!printState) return;
		const { transform, documentTitle, pageStyle } = printState;
		if (transform) mm.g.node().setAttribute('transform', transform);
		mindmap.removeAttribute('viewBox');
		document.title = documentTitle;
		pageStyle.remove();
		printState = undefined;
	}
</script>

<svelte:window on:keydown={handleKeydown} on:beforeprint={handleBeforePrint} on:afterprint={handleAfterPrint} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<svg id="markmap" bind:this={mindmap} xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	role="presentation"
	style="width:100%; height:100%; overflow: visible;" on:click={handleClick}>
</svg>
<style>
	svg {
		z-index: 0;
		position: absolute;
		top: 0;
		left: 0;
		overflow: visible;
	}
</style>