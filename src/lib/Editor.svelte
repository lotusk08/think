<script>
    import { onMount } from 'svelte';
    import { show, markdownSource } from './stores.js';
    import url from './url.js';
    import Turndown from 'turndown';
    import hljs from 'highlight.js';

    let textArea;
    let editor;
    let jar;
    let hidden;
    $: $show ? hidden = "" : hidden = "hidden";

    let CodeJar;

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

    onMount(async () => {
        const codeJarModule = await import("codejar");
        CodeJar = codeJarModule.CodeJar;

        jar = await CodeJar(editor, my, { history: true });
        editor.addEventListener('paste', handlePaste);
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

    function handlePaste(event) {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData;
        let pastedText = '';

        if (clipboardData.types.includes('text/plain')) {
            pastedText = clipboardData.getData('text/plain');
        } else if (clipboardData.types.includes('text/html')) {
            const htmlContent = clipboardData.getData('text/html');
            const turndownService = new Turndown({
                headingStyle: 'atx',
                hr: '---',
                bulletListMarker: '-',
                codeBlockStyle: 'fenced',
                emDelimiter: '*'
            });
            pastedText = turndownService.turndown(htmlContent);
        }

        if (pastedText && jar) {
            jar.insert(pastedText);
            markdownSource.update(() => jar.toString());
        }
    }
</script>

<div bind:this={textArea}>
    {#await CodeJar}
        <div>Editor loading...</div>
    {:then}
        <pre bind:this={editor} contenteditable="true" bind:textContent={$markdownSource} class:hidden={!$show} class="editor"></pre>
    {:catch error}
        <textarea bind:value={$markdownSource} rows="20" cols="50" class:hidden={!$show}></textarea>
    {/await}
</div>

<style>
    textarea,
    :global(.editor) {
        font-size: 14px;
        bottom: 4.25em;
        left: 1.75em;
        width: 40%;
        height: 30vh;
        position: absolute;
        z-index: 1;
        backdrop-filter: blur(5px);
        background-color: var(--editor-bg);
    }
    @media screen and (max-width:768px) {
        textarea, :global(.editor) {
            width: 85%;
            height: 35vh;
            bottom: 3em;
        }
    }

    textarea,
    :global(.hidden) {
        visibility: hidden;
    }

    :global(.editor) {
        border: 0.2px solid var(--border-color);
        border-radius: 6px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", Inter, Ubuntu, "Liberation Sans", sans-serif, "Source Code Pro", "SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace;
        font-size: 14px;
        letter-spacing: normal;
        line-height: 20px;
        padding: 10px;
        tab-size: 2;
        resize: horizontal !important;
    }

    :global(.language-xml *) {
        color: green !important;
        font-weight: 300 !important;
    }

    :global(.hljs-section) {
        color: var(--text-color);
        font-weight: inherit;
    }

    :global(.hljs-strong) {
        font-size: 0.95em;
        color: var(--text-color);
    }

    :global(.hljs-link),
    :global(.hljs-string) {
        color: var(--link-color);
        font-style: italic;
        font-size: 0.98em;
    }

    :global(.hljs-bullet) {
        color: #ff6800;
        font-weight: 700 !important;
    }

    :global(.hljs-emphasis) {
        color: inherit;
        font-size: italic;
    }

    :global(.hljs-special-tag) {
        color: #d360d4 !important;
    }

    :global(.hljs-code) {
        color: var(--text-color) !important;
        background-color: #77777737;
    }
    :global(.hljs-code *) {
        color: var(--text-color) !important;
    }

    :global(.hljs-comment) {
        color: #777 !important;
        font-weight: 100;
        font-size: 0.96em;
    }
</style>