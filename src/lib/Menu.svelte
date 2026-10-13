<script>
    import { tick } from "svelte";
    import { browser } from "$app/env";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { show, exportRequest, markdownSource, theme, notification, notify } from "./stores.js";

    export let showMenu;
    export let disableWarningMessage;

    // ?m=0 in the URL hides the menu
    const hiddenByURL = browser && new URLSearchParams(location.search).get("m") === "0";
    const disableMenu = !showMenu;
    if (hiddenByURL) {
        showMenu = false;
    }

    function menuEdit() {
        notification.set("");
        show.set(true);
    }

    function menuView() {
        show.set(false);
    }

    function menuShare() {
        notify("Link copied!");
        navigator.clipboard.writeText(location.origin + location.pathname + "#" + encodeURI($markdownSource));
    }

    // The Export menu and its keyboard shortcuts
    const exportItems = [
        { key: "p", icon: "fa-file-pdf", label: "PDF", hint: "Print-ready vector file: pick “Save as PDF” in the print dialog", run: () => window.print() },
        { key: "s", icon: "fa-file-image", label: "SVG", hint: "Static vector image", run: () => exportRequest.set("svg") },
        { key: "h", icon: "fa-file-code", label: "HTML", hint: "Interactive web page", run: () => exportRequest.set("html") },
        { key: "l", icon: "fa-link", label: "Link", hint: "Link that opens this map", run: menuShare }
    ];

    let exportOpen = false;
    let exportContainer;
    let exportButton;

    async function toggleExport() {
        exportOpen = !exportOpen;
        if (exportOpen) {
            await tick();
            exportContainer.querySelector('[role="menuitem"]').focus();
        }
    }

    function closeExport(restoreFocus = false) {
        exportOpen = false;
        if (restoreFocus) exportButton?.focus();
    }

    function runExport(item) {
        closeExport();
        item.run();
    }

    // Arrow keys move between the menu items
    function handleExportKeydown(event) {
        const items = [...exportContainer.querySelectorAll('[role="menuitem"]')];
        const index = items.indexOf(document.activeElement);
        const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 }[event.key];
        if (next !== undefined) {
            event.preventDefault();
            items[(next + items.length) % items.length].focus();
        }
    }

    function handleWindowClick(event) {
        if (exportOpen && !exportContainer.contains(event.target)) {
            closeExport();
        }
    }

    const shortcuts = {
        e: menuEdit,
        m: () => (showMenu = !showMenu),
        t: theme.toggle,
        ...Object.fromEntries(exportItems.map((item) => [item.key, item.run]))
    };

    function handleKeydown(event) {
        // Leave browser shortcuts (Cmd/Ctrl+S, Cmd/Ctrl+L…) alone
        if (event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }
        if (exportOpen && event.key === "Escape") {
            closeExport(true);
        } else if ($show) {
            if (event.key === "Escape") {
                menuView();
            }
        } else if (Object.hasOwn(shortcuts, event.key)) {
            // Keeps the "e" that opened the editor from being typed into it
            event.preventDefault();
            closeExport();
            shortcuts[event.key]();
        }
    }

    function beforeunload(event) {
        // No confirmation prompt when disableWarningMessage is true in the YAML,
        // when showMenu is false, or when the URL carries m=0
        if (disableWarningMessage === true || disableMenu || hiddenByURL) {
            return;
        }

        event.preventDefault();
        return (event.returnValue = "");
    }
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleWindowClick} on:beforeunload={beforeunload} />
{#if showMenu}
    <div
        class="menu-container"
        in:fly={{ y: 20, duration: 400, easing: quintOut }}
    >
        <nav id="menu">
            <div class="menu-items">
                {#if $show}
                    <button on:click|preventDefault={menuView} class="menu-btn" aria-label="Show only the mind map" title="Show only the mind map (Escape)">
                        <i class="fas fa-eye"></i>
                    </button>
                {:else}
                    <button on:click|preventDefault={menuEdit} class="menu-btn" aria-label="Edit the mind map" title="Edit the mind map (e)">
                        <i class="fas fa-pen"></i>
                    </button>
                {/if}
                <div class="export" bind:this={exportContainer}>
                    <button
                        bind:this={exportButton}
                        on:click={toggleExport}
                        class="menu-btn"
                        aria-label="Export"
                        aria-haspopup="menu"
                        aria-expanded={exportOpen}
                        aria-controls="export-menu"
                        title="Export: PDF, SVG, HTML or link"
                    >
                        <i class="fas fa-file-export"></i>
                    </button>
                    {#if exportOpen}
                        <div
                            id="export-menu"
                            class="export-menu"
                            role="menu"
                            tabindex="-1"
                            aria-label="Export"
                            on:keydown={handleExportKeydown}
                            transition:fly={{ y: 6, duration: 150 }}
                        >
                            {#each exportItems as item}
                                <button role="menuitem" class="export-item" title={item.hint} on:click={() => runExport(item)}>
                                    <i class="fas {item.icon}"></i>
                                    <span>{item.label}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
                <button
                    class="theme-toggle menu-btn"
                    on:click={theme.toggle}
                    aria-label={$theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                    title={$theme === 'light' ? 'Switch to dark theme (t)' : 'Switch to light theme (t)'}
                >
                    {#if $theme === "light"}
                        <i class="fas fa-moon"></i>
                    {:else}
                        <i class="fas fa-sun"></i>
                    {/if}
                </button>
            </div>
        </nav>

        {#if $notification}
            <div
                id="shareNotification"
                in:fly={{ y: 5, duration: 1000}}
                out:fade
            >
                {$notification}
            </div>
        {/if}
    </div>
{/if}

<style>
    .menu-container {
        position: absolute;
        bottom: 1.5em;
        left: 1.5em;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10;
    }

    #menu {
        position: relative;
        display: flex;
        padding: 0.4rem 1rem;
        gap: 0.35rem;
        border-radius: 6px;
        backdrop-filter: blur(5px);
        background-color: var(--menu-bg);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        border: none;
    }

    .menu-items {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    #menu:hover {
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.15);
    }

    #menu button {
        text-decoration: none;
    }

    .menu-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 2.25em;
        height: 2.25em;
        border: none;
        background-color: transparent;
        border-radius: 4px;
        transition: all 0.2s ease;
        cursor: pointer;
    }

    .menu-btn i {
        color: var(--icon-color);
        font-size: 0.85rem;
        transition: all 0.2s ease;
    }

    .menu-btn:hover {
        transform: translateY(-2px);
        background-color: var(--editor-bg);
    }

    .menu-btn:hover i {
        color: var(--icon-hover) !important;
    }

    /* Lines up with the toolbar (#menu), above it */
    .export-menu {
        position: absolute;
        bottom: calc(100% + 0.5rem);
        left: 0;
        display: flex;
        flex-direction: column;
        min-width: 100%;
        box-sizing: border-box;
        padding: 0.3rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background-color: var(--bg-color);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    }

    .export-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.45rem 0.6rem;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--text-color);
        font: 400 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", Inter, Ubuntu, "Liberation Sans", sans-serif;
        text-align: left;
        cursor: pointer;
    }

    .export-item i {
        width: 1rem;
        color: var(--icon-color);
        text-align: center;
    }

    .export-item:hover,
    .export-item:focus-visible {
        outline: none;
        background-color: rgba(127, 127, 127, 0.12);
    }

    .export-item:hover i,
    .export-item:focus-visible i {
        color: var(--icon-hover);
    }

    @media print {
        .menu-container {
            display: none;
        }
    }

    .theme-toggle {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        color: inherit;
        outline: none;
    }

    .theme-toggle:focus-visible {
        outline: 2px solid var(--icon-hover);
        border-radius: 5px;
    }

    #shareNotification {
        position: absolute;
        bottom: 5em;
        padding: 0.75em 1.25em;
        backdrop-filter: blur(5px);
        background-color: var(--menu-bg);
        color: var(--text-color);
        border-radius: 6px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        border: none;
        font-size: 10px;
        font-weight: 400;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", Inter, Ubuntu, "Liberation Sans", sans-serif, "Source Code Pro", "SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace;
    }

    @media screen and (max-width: 768px) {
        #menu {
            position: fixed;
            bottom: 1em;
            left: 50%;
            transform: translateX(-50%);
        }
        
        #shareNotification {
            position: fixed;
            bottom: 6.5em;
            left: 50%;
            transform: translateX(-50%);
        }
    }
</style>