<script context="module">
    import hljs from "highlight.js/lib/core";
    import markdown from "highlight.js/lib/languages/markdown";
    import xml from "highlight.js/lib/languages/xml";

    hljs.registerLanguage("markdown", markdown);
    hljs.registerLanguage("xml", xml);
</script>

<script>
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { show, markdownSource } from './stores.js';
    import Turndown from 'turndown';

    let textArea;
    let editor;
    let jar;
    let hidden;
    $: $show ? hidden = "" : hidden = "hidden";

    let CodeJar;
    let firefoxVersion = 0;
    let unsubscribeFromMarkdownSource = () => {};
    let syncingFromJar = false;
    let fallbackValue = "";

    const my = editor => {
        let code = editor.textContent;
        code = code.replace(/:(.*)_(.*?):/g, ':$1@underscore$2:');
        code = code.replace(/:(.*)_(.*?):/g, ':$1@underscore$2:');
        code = code.replace(/:(.*)_(.*?):/g, ':$1@underscore$2:');
        code = hljs.highlight(code, {
            language: 'markdown',
            ignoreUnescapedHTML: false
        }).value;
        // Les caractères < et > sont échappés par highlight.js : on travaille donc sur &lt; et &gt;
        code = code
            .replace(/(theme:|maxWidth:|mw:|initialExpandLevel:|colorFreezeLevel:|focusOnBranch:|automaticResize:|openLinksInNewTab:|disableWarningMessage:|showMenu:|curves:|title:)/g,
                '<span class="hljs-yaml-property">$1</span>')
            .replace(/\\\\/g, '<span class="language-xml"><span class="hljs-tag">\\\\</span></span>')
            .replace(/&lt;!--(.*?)--&gt;/g, '<span class="hljs-comment">&lt;!--$1--&gt;</span>')
            .replace(/&lt;!--(\s*?)fold(\s*?)--&gt;/g, '<span class="language-xml"><span class="hljs-special-tag">&lt;!--$1fold$2--&gt;</span></span>');
        code = code.replace(/@underscore/g, '_');
        editor.innerHTML = code;
    };

    onMount(() => {
        let mounted = true;
        fallbackValue = get(markdownSource);

        (async () => {
            ({ CodeJar } = await import("codejar"));

            if (!mounted) {
                return;
            }

            jar = CodeJar(editor, my, {
                history: true,
                autoclose: { open: `(["`, close: `)]"` },
            });
            // CodeJar does not highlight on creation: seed the content through
            // updateCode so the initial markdown is syntax-highlighted too
            jar.updateCode(get(markdownSource), false);
            jar.onUpdate(code => {
                if (code != get(markdownSource)) {
                    syncingFromJar = true;
                    markdownSource.set(code);
                    syncingFromJar = false;
                }
            });

            // L'éditeur est isolé de la réactivité de Svelte : on synchronise à la main
            unsubscribeFromMarkdownSource = markdownSource.subscribe(code => {
                if (!jar) {
                    if (code != fallbackValue) {
                        fallbackValue = code;
                    }
                    return;
                }

                if (syncingFromJar || code == jar.toString()) {
                    return;
                }

                jar.updateCode(code, false);
            });

            // Capture phase so this runs before CodeJar's own paste handler
            editor.addEventListener('paste', handlePaste, true);

            const matchFirefoxVersion =
                window.navigator.userAgent.match(/Firefox\/([0-9]+)\./);
            firefoxVersion = matchFirefoxVersion
                ? parseInt(matchFirefoxVersion[1])
                : 0;
        })();

        return () => {
            mounted = false;
            unsubscribeFromMarkdownSource();
            if (editor) {
                editor.removeEventListener('paste', handlePaste, true);
            }
            if (jar) {
                jar.destroy();
            }
        };
    });

    $: if ($show == true) {
        setTimeout(function () {
            // Svelte 5 renders anchor comments around blocks, so textArea.firstChild
            // is not necessarily the editable element: target it explicitly.
            const target = editor || textArea?.querySelector("textarea");
            if (!target) {
                return;
            }
            target.focus();
            if (editor && firefoxVersion >= 136) {
                editor.setAttribute("contenteditable", "true");
            }
        }, 0);
    }

    // Firefox (>= 136 in particular) can expose an HTML-only clipboard: convert it to
    // Markdown ourselves. When plain text is available, CodeJar's own handler is fine.
    function handlePaste(event) {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData || !jar) {
            return;
        }

        const types = Array.from(clipboardData.types || []);
        if (types.includes('text/plain') || !types.includes('text/html')) {
            return;
        }

        const turndownService = new Turndown({
            headingStyle: 'atx',
            hr: '---',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            emDelimiter: '*'
        });
        const pastedText = turndownService
            .turndown(clipboardData.getData('text/html'))
            .replace(/\r\n?/g, '\n');

        if (!pastedText) {
            return;
        }

        event.preventDefault();

        const pos = jar.save();
        const start = Math.min(pos.start, pos.end);
        const end = Math.max(pos.start, pos.end);
        const code = jar.toString();

        jar.recordHistory();
        jar.updateCode(code.slice(0, start) + pastedText + code.slice(end));
        jar.restore({
            start: start + pastedText.length,
            end: start + pastedText.length,
            dir: '<-'
        });
    }
</script>

<div bind:this={textArea}>
    {#await CodeJar}
        <div>Editor loading...</div>
    {:then}
        <div
            bind:this={editor}
            contenteditable="true"
            spellcheck="false"
            class:hidden={!$show}
            class="editor">
        </div>
    {:catch error}
        <textarea
            value={fallbackValue}
            on:input={(event) => markdownSource.set(event.currentTarget.value)}
            rows="20"
            cols="50"
            class:hidden={!$show}></textarea>
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
        white-space: pre-wrap;
        overflow-wrap: normal;
        overflow-x: auto;
        padding: 10px;
        tab-size: 2;
        resize: horizontal !important;
    }

    :global(.language-xml *) {
        color: #d360d4 !important;
        font-weight: 300 !important;
    }

    :global(.hljs-section) {
        color: var(--text-color) !important;
        font-weight: 600 !important;
    }

    :global(.hljs-strong) {
        font-size: 0.95em;
        color: inherit !important;
    }

    :global(.hljs-link),
    :global(.hljs-string) {
        color: var(--link-color) !important;
        font-style: italic;
        font-size: 0.98em;
    }

    :global(.hljs-bullet) {
        color: var(--bullet-color) !important;
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

    :global(.hljs-yaml-property) {
        color: var(--yaml-property-color) !important;
        font-weight: bold;
    }
</style>
