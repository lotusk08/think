<script context="module">
  import hljs from "highlight.js/lib/core";
  import markdown from "highlight.js/lib/languages/markdown";
  import xml from "highlight.js/lib/languages/xml";
  import 'highlight.js/styles/github.css';

  hljs.registerLanguage("markdown", markdown);
  hljs.registerLanguage("xml", xml);
</script>

<script>
  import { onMount } from 'svelte';
  import { show, markdownSource } from './stores.js';
  import url from './url.js';
  import { fly, fade } from 'svelte/transition';

  let textArea;
  let editor;

  const my = editor => {
	let code = editor.textContent;
	code = code.replace(/:(.*)_(.*?):/g, ':$1@underscore$2:');
	code = code.replace(/:(.*)_(.*?):/g, ':$1@underscore$2:');
	code = code.replace(/:(.*)_(.*?):/g, ':$1@underscore$2:');
	code = hljs.highlight(code, {
	  language: 'markdown',
	  ignoreUnescapedHTML: false
	}).value;
	code = code.replace(/\\\\/g, '<span class="language-xml"><span class="hljs-tag">\\\\</span></span>')
	  .replace(/<!--(.*?)-->/g, '<span class="hljs-comment"><!--$1--></span>')
	  .replace(/<!--(\s*?)fold(\s*?)-->/g, '<span class="language-xml"><span class="hljs-special-tag"><!--$1fold$2--></span></span>');
	code = code.replace(/@underscore/g, '_');
	editor.innerHTML = code;
  };

  let jar;
  let hidden;
  $: $show ? hidden = "" : hidden = "hidden";

  let CodeJar;

  onMount(async () => {
	({ CodeJar } = await import("codejar"));
	jar = await CodeJar(editor, my, { history: true });
  });

  $: if ($show == true) {
	setTimeout(function () {
	  textArea.firstChild.focus();
	}, 0);
  }

  $: if (jar) {
	jar.onUpdate(code => {
	  if (jar.toString() != $markdownSource) {
		markdownSource.update(n => code);
	  }
	});
  }
</script>

<div bind:this={textArea}>
  {#await CodeJar}
	<div>Editor loading...</div>
  {:then}
	{#if $show}
	  <div transition:fly={{ y: 20, duration: 200, easing: t => --t * t * t + 1 }} class="editor-container">
		<div class="editor-wrapper">
		  <pre bind:this={editor} contenteditable="true" bind:textContent={$markdownSource} class="editor"></pre>
		</div>
	  </div>
	{/if}
  {:catch error}
	{#if $show}
	  <div transition:fly={{ y: 20, duration: 200, easing: t => --t * t * t + 1 }} class="editor-container">
		<div class="editor-wrapper">
		  <textarea bind:value={$markdownSource} rows="20" cols="50"></textarea>
		</div>
	  </div>
	{/if}
  {/await}
</div>

<style>
  .editor-container {
	position: absolute;
	bottom: 4.5em;
	left: 1.5em;
	width: 40%;
	max-width: 600px;
	z-index: 1;
	display: flex;
	flex-direction: column;
	height: 40vh;
  }

  textarea,
  :global(.editor) {
	font-size: 14px;
	height: 50vh;
	position: relative;
	backdrop-filter: blur(5px);
	background-color: rgba(255, 255, 255, 0.02);
	border-radius: 8px;
	transition: all 0.3s ease;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	border: 1px solid #e0e0e0;
	padding: 15px;
	overflow: auto;
	white-space: pre-wrap;
	word-wrap: break-word;
  }

  @media screen and (max-width: 768px) {
	.editor-container {
	  width: 90%;
	  bottom: 4.5em;
	  height: 50vh;
	}
	
	textarea,
	:global(.editor) {
	  height: 100%;
	}
  }

  .editor-wrapper {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	width: 100%;
	border-radius: 8px;
  }

  :global(.editor) {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Ubuntu, sans-serif;
	font-size: 14px;
	letter-spacing: normal;
	line-height: 20px;
	tab-size: 2;
	flex: 1;
	margin: 0;
	max-height: 100%;
  }

  :global(.editor):focus {
	outline: none;
	border-color: #007bff;
	box-shadow: 0 4px 15px rgba(0, 123, 255, 0.15);
  }

  :global(.language-xml *) {
	color: green !important;
	font-weight: 300 !important;
  }

  :global(.hljs-strong) {
	font-size: 0.95em;
  }

  :global(.hljs-section .hljs-strong) {
	color: #032f62;
  }

  :global(.hljs-link),
  :global(.hljs-string) {
	color: #032f62;
	font-style: italic;
	font-size: 0.98em;
  }

  :global(.hljs-bullet) {
	color: #990000;
	font-weight: 700 !important;
  }

  :global(.hljs-emphasis) {
	color: inherit;
  }

  :global(.hljs-special-tag) {
	color: #A52A2A !important;
  }

  :global(.hljs-code) {
	color: #333 !important;
	background-color: #EDEDED;
  }
  :global(.hljs-code *) {
	color: #333 !important;
  }

  :global(.hljs-comment) {
	color: #777 !important;
	font-weight: 100;
	font-size: 0.96em;
  }
</style>