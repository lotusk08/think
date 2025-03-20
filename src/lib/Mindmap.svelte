<script>
	import {
		afterUpdate,
		onMount
	} from 'svelte';
	export let source;
	import {
		Transformer
	} from 'markmap-lib';
	import * as markmap from 'markmap-view';
	import {deriveOptions} from 'markmap-view';
	import {
		mindmapSaveAsSvg,
		mindmapSaveAsHtml,
		wValue,
		hValue,
		markdownSource,
		show
	} from './stores.js';
	export let maxWidth;
	export let style;
	export let title;
	export let colorFreezeLevel;
	export let initialExpandLevel;
	export let openLinksInNewTab;
	export let curves;
	export let focusOnBranch;
	export let automaticResize;

	let mindmap;
	let w;
	let h;
	let widthBlockquote;
	let marginLeftBlockquote='';
	let nodeTitle;
	let description;
	let isMobile = false;
	let lastTapTime = 0;
	$: description = $markdownSource;

	onMount(() => {
		isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
		automaticResize = isMobile ? false : true;
	})
	let mm;
	let initialFitDone = false;

	$: if (maxWidth<250) {
		widthBlockquote = maxWidth;
		marginLeftBlockquote='margin-left:-10px;';
	} else {
		widthBlockquote= 250;
		marginLeftBlockquote='';
	}
	let mindmapRoot;

	$: wValue.update(n => w)
	$: hValue.update(n => h)

	// Fonction debounce pour gérer l'update de la carte avec un délai
	// fonction utilisée pour changer les lignes en courbe après affichage
	// et afin d'éviter un clignotement à chaque touche appuyée
	function debounce(func, wait) {
		let timeout;
		return function(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	function curvesToLines() {
		if(mindmap && !curves) {
			const paths = mindmap.querySelectorAll('path');
			paths.forEach(path => {
				const d = path.getAttribute('d');
				if (d && d.includes('C')) {
					const newD = d.replace('C','L')
					path.setAttribute('d', newD);
				}
			});
		}
	}
	const debouncedCurvesToLines = debounce(curvesToLines, 500);

	function setLinksToOpenInNewTab() {
		const links = mindmap.querySelectorAll('a');
		links.forEach(link => {
			link.setAttribute('target', '_blank');
		});
	}

	afterUpdate(() => {
		const transformer = new Transformer();

		const {
			root,
			features
		} = transformer.transform(source);
		const {
			styles,
			scripts
		} = transformer.getUsedAssets(features);
		const {
			Markmap,
			loadCSS,
			loadJS
		} = markmap;

		if (styles) loadCSS(styles);
		if (scripts) loadJS(scripts, {
			getMarkmap: () => markmap
		});

		const options = {
			duration: 0,
			maxWidth: maxWidth,
			spacingVertical: 15,
			paddingX: 20,
			autoFit: false,
			initialExpandLevel: initialExpandLevel,
			paddingY: 20,
		}
		const optionsJSON = deriveOptions({
			color: getComputedStyle(document.documentElement).getPropertyValue('--mindmap-branch-colors').split(',').map(c => c.trim()),
			colorFreezeLevel: colorFreezeLevel,
		})
		const optionsFull = colorFreezeLevel > 0 ? {...options, ...optionsJSON} : options
		mindmap.innerHTML = "";
		mindmapRoot = root;
		nodeTitle = document.createElement("title")
		nodeTitle.innerHTML=title;
		mindmap.appendChild(nodeTitle);
		const styleCSS = `
			svg div{margin-top:-4px;} 
			svg a {text-decoration:none} 
			svg foreignObject {overflow:visible;} 
			svg strong{
				font-size:0.95em; 
				font-weight:600;
			} 
			svg .hide, svg .hide *{
				color:var(--text-color)!important;
				opacity: 0.2;
			} 
			svg .hide {
				background-color:var(--mindmap-hide-bg);
				border-radius:1px;
				transition: opacity 0.2s ease;
			} 
			svg .hide:hover {
				opacity: 0.8;
			} 
			svg .hide img {opacity:0} 
			svg img[alt=h-25]{height:25px} 
			svg img[alt=h-50]{height:50px} 
			svg img[alt=h-75]{height:75px} 
			svg img[alt=h-100]{height:100px} 
			svg img[alt=h-125]{height:125px} 
			svg img[alt=h-150]{height:150px} 
			svg img[alt=h-175]{height:175px} 
			svg img[alt=h-200]{height:200px} 
			svg blockquote {
				width:${widthBlockquote}px!important; 
				white-space: normal; 
				text-align:justify; 
				font-size:0.8em; 
				line-height:1em; 
				border:1px solid var(--mindmap-blockquote-border); 
				padding:10px; 
				border-radius:4px;
				${marginLeftBlockquote}
			} 
			svg aside{
				font-size: 0.8em; 
				display: inline-block!important; 
				font-weight:normal;
				vertical-align: top
			} 
			svg cite {
				font-style:inherit; 
				font-family:serif; 
				font-size:0.97em
			} 
			svg code, .markmap-foreign code {
				color: var(--mindmap-code-color); 
				background-color: var(--mindmap-code-bg); 
				border-radius: var(--code-border-radius);
				padding: var(--code-padding);
				font-size: var(--code-font-size);
			}
			.markmap-foreign code {
				color: var(--mindmap-code-color) !important;
				background-color: var(--mindmap-code-bg) !important;
			}
		` + style;
		const styleElement = document.createElement("style")
		styleElement.innerHTML=styleCSS;
		mindmap.appendChild(styleElement);

		mm=Markmap.create('#markmap', optionsFull, root);

		// Initial fit with a slight delay to ensure proper rendering
		if (automaticResize && !initialFitDone) {
			setTimeout(() => {
				mm.fit();
				initialFitDone = true;
			}, 100);
		}

		if (curves === false) {
			debouncedCurvesToLines();
			document.body.addEventListener("keyup", debouncedCurvesToLines);
		}

		if(openLinksInNewTab) {
			setLinksToOpenInNewTab()
		}

		

	})

	function trimFromLastDot(str) {
		const lastDotIndex = str.lastIndexOf('.');
		return lastDotIndex !== -1 ? str.substring(0, lastDotIndex) : str;
	}

	function handleDoubleTap(event) {
		// Check if we're on mobile and should process this as a double-tap
		if (isMobile) {
			const currentTime = new Date().getTime();
			const tapLength = currentTime - lastTapTime;
			
			if (tapLength < 500 && tapLength > 0) {
				// Double tap detected
				event.preventDefault();
				toggleAutomaticResize();
				return true;
			}
			lastTapTime = currentTime;
		}
		return false;
	}

	function toggleAutomaticResize() {
		automaticResize = !automaticResize;
		if (automaticResize) {
			setTimeout(() => mm.fit(), 50);
		}
	}

	function handleHide(event) {
		// First check for double tap on mobile
		if (handleDoubleTap(event)) {
			return;
		}

		let targetElement = event.target
		const elementType = targetElement.tagName
		let searchDivCount = 0;
		if (elementType == 'SVG') {
			return
		} else {
			if(elementType =='circle') {
				// On gère à nouveau l'ouverture des liens dans un autre onglet si on utilise cette option dans le yaml
				if(openLinksInNewTab) {
					setLinksToOpenInNewTab()
				}
				// On gère à nouveau la conversion en lignes droites si besoin
				if (curves === false) {
					debouncedCurvesToLines();
				}
			}
			if (elementType =='circle' && (event.altKey || focusOnBranch)) {
				const parentElement = targetElement.parentElement;
				const dataPathParentElement = parentElement.getAttribute('data-path');
				const sameLevelBranches = trimFromLastDot(dataPathParentElement)
				const unfoldedBranches = mindmap.querySelectorAll('g[data-path^="'+sameLevelBranches+'."]:not(.markmap-fold)')
				const circleFill = targetElement.getAttribute('fill')
				for (const branch of unfoldedBranches) {
					const circle = branch.querySelector('circle');
					if (circle) {
						circle.dispatchEvent(new MouseEvent("click"));
					}
				}
				if(!focusOnBranch || circleFill != 'rgb(255, 255, 255)') {
					if(dataPathParentElement != "1") {
						targetElement.dispatchEvent(new MouseEvent("click"));
					}
				}
				if(automaticResize) {
					setTimeout(() => mm.fit(), 50);
				}
				return
			}
			while (targetElement && targetElement.tagName !== 'DIV' && searchDivCount < 5) {
				targetElement = targetElement.parentElement;
				searchDivCount++;
			}
		}
		if (targetElement.tagName == 'DIV') {
			if (event.altKey) {
				targetElement.classList.toggle('hide'); }
			else {
				targetElement.classList.remove('hide');
			}
		}
		if(automaticResize) {
			setTimeout(() => mm.fit(), 50);
		}
	}

	function getBBox(element) {
		const {x, y, width, height} = element.getBBox();
		return {x: x - 20, y: y - 20, w: width + 40, h: height + 40};
	}


	function createSVG(mm) {
		const boundingBox = getBBox(mindmap)
		mm = mm.replace(/<br>/g, '<br/>')
		mm = mm.replace(/\n/g, ' ')
		mm = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd"><svg id="markmap" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="' + mindmap.className['baseVal'] + '" style="width:100%; height:100%;" viewBox="' + boundingBox.x + ' ' + (boundingBox.y) + ' ' + (boundingBox.w) + ' ' + (boundingBox.h) + '">'+'<use xlink:href=""><title>'+title+'</title></use>'+'<desc>'+description.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&lt;')+'</desc>'+ mm.replace(/<title>.*<\/title>/,'') + '</svg>'
		return mm;
	}

	function mindMapSaveAsSvgCreateFile() {
		const file = new File([createSVG(mindmap.innerHTML)], "mindmap.svg", {
			type: "text/plain;charset=utf-8"
		});
		saveAs(file);
	}

	function mindMapSaveAsHtmlCreateFile() {
		const root = JSON.stringify(mindmapRoot);
		const escapedDesc = description.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&lt;');
		let templateHtml = `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>${title}</title>
	<style>
		:root {
			--mindmap-code-bg: #f5f5f5;
			--mindmap-code-color: #333;
			--mindmap-blockquote-border: #aaa;
			--mindmap-hide-bg: rgba(200, 200, 200, 0.85);
			--text-color: #494949;
			--bg-color: #fcfcf9;
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
			}
		}
		[data-theme="dark"] {
			--mindmap-code-bg: #2d2d2d;
			--mindmap-code-color: #e0e0e0;
			--mindmap-blockquote-border: #555;
			--mindmap-hide-bg: rgba(80, 80, 80, 0.85);
			--text-color: #e7e7e7;
			--bg-color: #1a1a1a;
		}
		* { margin:0; padding:0 }
		body { background-color: var(--bg-color); color: var(--text-color); }
		#markmap { display:block; width:100vw; height:100vh }
		.markmap-foreign code {
			color: var(--mindmap-code-color) !important;
			background-color: var(--mindmap-code-bg) !important;
			border-radius: var(--code-border-radius);
			padding: var(--code-padding);
			font-size: var(--code-font-size);
		}
	</style>
</head>
<body>
	<svg id="markmap">
		<use xlink:href=""><title>${title}</title></use>
		<desc>${escapedDesc}</desc>
	</svg>
	<script src="https://cdn.jsdelivr.net/npm/d3"><\/script>
	<script src="https://cdn.jsdelivr.net/npm/markmap-view"><\/script>
	<script>
		const root=${root};
		const{Markmap, loadCSS, loadJS}=window.markmap;
		const maxWidth=${maxWidth};
		const styles=\`
			div{padding-bottom:0.12em!important}
			a {text-decoration:none}
			foreignObject {overflow:visible}
			strong{color:var(--text-color); font-size:0.95em!important; font-weight:600!important;}
			.hide, .hide *{color:var(--text-color)!important; opacity:0.2;}
			.hide {background-color:var(--mindmap-hide-bg); border-radius:1px; transition:opacity 0.2s ease;}
			.hide:hover {opacity:0.8;}
			.hide img {opacity:0}
			img[alt=h-25]{height:25px}
			img[alt=h-50]{height:50px}
			img[alt=h-75]{height:75px}
			img[alt=h-100]{height:100px}
			img[alt=h-125]{height:125px}
			img[alt=h-150]{height:150px}
			img[alt=h-175]{height:175px}
			img[alt=h-200]{height:200px}
			blockquote {
				width:${widthBlockquote}px!important;
				white-space:normal;
				text-align:justify;
				font-size:0.8em;
				line-height:1em;
				border:1px solid var(--mindmap-blockquote-border);
				padding:10px;
				border-radius:4px;
				${marginLeftBlockquote}
			}
			aside{font-size:0.8em; display:inline-block!important; font-weight:normal; vertical-align:top}
			cite {font-style:inherit; font-family:serif; font-size:0.97em}
			code {
				color:var(--mindmap-code-color);
				background-color:var(--mindmap-code-bg);
				border-radius:var(--code-border-radius);
				padding:var(--code-padding);
				font-size:var(--code-font-size);
			}
			${style.replaceAll('"','\\"')}
		\`;
		const options={
			duration:0,
			style:id=>styles,
			maxWidth:maxWidth,
			spacingVertical:8,
			paddingX:15,
			autoFit:true
		};
		Markmap.create("#markmap", options, root);
	<\/script>
</body>
</html>`;
		const file = new File([templateHtml], "mindmap.html", {
			type: "text/plain;charset=utf-8"
		});
		saveAs(file);
	}

	$: if ($mindmapSaveAsSvg) {
		mindMapSaveAsSvgCreateFile();
		mindmapSaveAsSvg.update(n => false)
	}

	$: if ($mindmapSaveAsHtml) {
		mindMapSaveAsHtmlCreateFile();
		mindmapSaveAsHtml.update(n => false)
	}

	function handleKeydown(event) {
		if (!$show && event.key === 'r') {
			toggleAutomaticResize();
		}
	}

	// Add touch event listeners for mobile devices
	function handleTouchStart(event) {
		// Just using the click handler as it already handles double-tap detection
	}

</script>

<svelte:window on:keydown={handleKeydown} />

<div bind:clientWidth={w} bind:clientHeight={h} style="width:100vw; height:100vh">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<svg id="markmap" bind:this={mindmap} xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
		style="width:100%; height:100%; overflow: visible;" on:click={handleHide} on:touchstart={handleTouchStart}>
	</svg>
</div>
<style>
	svg {
		z-index: 0;
		position: absolute;
		top: 0;
		left: 0;
		overflow: visible;
	}

	@media print {
		:global(nav) {
			display: none;
		}

		:global(main) {
			width: 31.7cm;
			height: 20cm;
		}

		:global(main svg) {
			overflow: visible;
			/* Allow scaling to be controlled by the fit function instead */
			zoom: 100% !important;
		}

	}

</style>