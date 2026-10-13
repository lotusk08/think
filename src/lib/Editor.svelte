<script context="module">
    import hljs from "highlight.js/lib/core";
    import markdown from "highlight.js/lib/languages/markdown";
    import xml from "highlight.js/lib/languages/xml";

    hljs.registerLanguage("markdown", markdown);
    hljs.registerLanguage("xml", xml);
</script>

<script>
    import { onMount, tick } from 'svelte';
    import { get } from 'svelte/store';
    import { show, markdownSource, notify, clearSavedData } from './stores.js';
    import { OPTION_KEYS } from './options.js';
    import { initialDemoContent, defaultTemplate } from './content.js';

    const yamlProperty = new RegExp(`(${OPTION_KEYS.join('|')}):`, 'g');

    let editor;
    let jar;
    let turndownReady;

    const highlight = editor => {
        // Keep the underscores of :emoji_codes: from being highlighted as emphasis
        let code = editor.textContent.replace(/:[\w+-]+:/g, emoji => emoji.replaceAll('_', '@underscore'));
        code = hljs.highlight(code, {
            language: 'markdown',
            ignoreUnescapedHTML: false
        }).value;
        // highlight.js escapes < and >, so match &lt; and &gt;
        code = code
            .replace(yamlProperty, '<span class="hljs-yaml-property">$1:</span>')
            .replace(/\\\\/g, '<span class="language-xml"><span class="hljs-tag">\\\\</span></span>')
            .replace(/&lt;!--(.*?)--&gt;/g, '<span class="hljs-comment">&lt;!--$1--&gt;</span>')
            .replace(/&lt;!--(\s*?)fold(\s*?)--&gt;/g, '<span class="language-xml"><span class="hljs-special-tag">&lt;!--$1fold$2--&gt;</span></span>');
        editor.innerHTML = code.replace(/@underscore/g, '_');
    };

    onMount(() => {
        let unsubscribe;

        // CodeJar touches `window` when its module loads, so it can't be imported
        // during prerendering
        import('codejar').then(({ CodeJar }) => {
            if (!editor) {
                return;
            }
            jar = CodeJar(editor, highlight, {
                history: true,
                autoclose: { open: `(["`, close: `)]"` },
            });
            // The editor sits outside Svelte's reactivity: sync it with the store by hand.
            // Subscribing also seeds the content (CodeJar does not highlight on creation).
            unsubscribe = markdownSource.subscribe(code => {
                if (code != jar.toString()) {
                    jar.updateCode(code, false);
                }
            });
            jar.onUpdate(code => {
                if (code != get(markdownSource)) {
                    markdownSource.set(code);
                }
            });
            // Capture phase so this runs before CodeJar's own paste handler
            editor.addEventListener('paste', handlePaste, true);
        });

        return () => {
            unsubscribe?.();
            editor?.removeEventListener('paste', handlePaste, true);
            jar?.destroy();
        };
    });

    function clearAll() {
        // Only ask before throwing away something the user actually wrote:
        // the demo map and the blank template are not worth confirming.
        const code = get(markdownSource);
        const isUntouched = code === initialDemoContent || code === defaultTemplate;
        if (!isUntouched && !confirm("This will clear your current data. Sure?")) {
            return;
        }

        clearSavedData();
        markdownSource.set(defaultTemplate);
        notify("Data cleared!");
        editor.focus();
    }

    $: if ($show && editor) {
        tick().then(() => editor.focus());
    }

    function loadTurndown() {
        turndownReady ??= import('turndown').then(({ default: Turndown }) => new Turndown({
            headingStyle: 'atx',
            hr: '---',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            emDelimiter: '*'
        }));
        return turndownReady;
    }

    // Firefox (>= 136 in particular) can expose an HTML-only clipboard: convert it to
    // Markdown ourselves. When plain text is available, CodeJar's own handler is fine.
    async function handlePaste(event) {
        const types = Array.from(event.clipboardData?.types || []);
        if (!jar || types.includes('text/plain') || !types.includes('text/html')) {
            return;
        }

        event.preventDefault();
        // Clipboard data is only readable during the event
        const html = event.clipboardData.getData('text/html');
        let pastedText;
        try {
            pastedText = (await loadTurndown()).turndown(html);
        } catch {
            // The converter could not load (e.g. offline): paste the plain text
            turndownReady = undefined;
            pastedText = new DOMParser().parseFromString(html, 'text/html').body.textContent;
        }
        pastedText = pastedText.replace(/\r\n?/g, '\n');
        if (!pastedText) {
            return;
        }

        // Read the caret only now, so back-to-back pastes land one after the other
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

<div class="editor-panel" class:hidden={!$show}>
    <div
        bind:this={editor}
        contenteditable="true"
        spellcheck="false"
        class="editor">
    </div>
    <button
        class="clear"
        on:click={clearAll}
        aria-label="Clear mind map and browser cache"
        title="Clear mind map and browser cache"
    >
        <i class="fas fa-eraser"></i>
    </button>
</div>

<style>
    /* Shrink-wraps the editor, so the eraser follows it when it is resized */
    .editor-panel {
        font-size: 14px;
        bottom: 4.25em;
        left: 1.75em;
        position: absolute;
        z-index: 1;
    }

    .editor {
        width: 40vw;
        height: 30vh;
        backdrop-filter: blur(5px);
        background-color: var(--editor-bg);
    }

    @media screen and (max-width:768px) {
        .editor-panel {
            bottom: 3em;
        }
        .editor {
            width: 85vw;
            height: 35vh;
        }
    }

    .clear {
        position: absolute;
        top: 6px;
        right: 6px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 2em;
        height: 2em;
        border: none;
        border-radius: 4px;
        background-color: transparent;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .clear i {
        color: #d360d4;
        font-size: 0.85rem;
    }

    .clear:hover,
    .clear:focus-visible {
        outline: none;
        background-color: rgba(127, 127, 127, 0.12);
    }

    /* display:none rather than visibility:hidden: Safari paints the resize grip
       of a resizable element in its own layer and keeps drawing it when the
       element is merely invisible, leaving the handle floating over the map. */
    .hidden {
        display: none;
    }

    /* Slides in from the left and back out; `display` flips only once the
       slide is over (browsers without allow-discrete just show/hide) */
    @media screen and (prefers-reduced-motion: no-preference) {
        .editor-panel {
            transition:
                transform 0.3s cubic-bezier(0.215, 0.61, 0.355, 1),
                opacity 0.3s ease,
                display 0.3s allow-discrete;
        }

        .editor-panel.hidden {
            transform: translateX(calc(-100% - 2em));
            opacity: 0;
        }

        @starting-style {
            .editor-panel {
                transform: translateX(calc(-100% - 2em));
                opacity: 0;
            }
        }
    }

    @media print {
        .editor-panel {
            display: none;
        }
    }

    .editor {
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
