<script>
    import { browser } from "$app/env";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import {
        show,
        mindmapSaveAsSvg,
        mindmapSaveAsHtml,
        markdownSource,
        theme
    } from "./stores.js";
    import { initialDemoContent, defaultTemplate } from "./content.js";

    export let showMenu;
    export let disableWarningMessage;

    // ?m=0 in the URL hides the menu
    const hiddenByURL = browser && new URLSearchParams(location.search).get("m") === "0";
    const disableMenu = !showMenu;
    if (hiddenByURL) {
        showMenu = false;
    }

    let showNotification = false;
    let notificationMessage = "";

    function toastNotification(message) {
        notificationMessage = message;
        showNotification = true;
        setTimeout(() => (showNotification = false), 2000);
    }

    function menuEdit() {
        showNotification = false;
        show.set(true);
    }

    function menuView() {
        show.set(false);
    }

    function menuSaveAsSvg() {
        mindmapSaveAsSvg.set(true);
    }

    function menuSaveAsHtml() {
        mindmapSaveAsHtml.set(true);
    }

    function menuShare() {
        toastNotification("Link copied!");
        navigator.clipboard.writeText(location.origin + location.pathname + "#" + encodeURI($markdownSource));
    }

    function menuReset() {
        // Only ask before throwing away something the user actually wrote:
        // the demo map and the blank template are not worth confirming.
        const isUntouched =
            $markdownSource === initialDemoContent ||
            $markdownSource === defaultTemplate;

        if (!isUntouched && !confirm("This will clear your current data. Sure?")) {
            return;
        }

        // The theme is the only thing worth keeping across a reset
        const savedTheme = localStorage.getItem("theme");
        localStorage.clear();
        if (savedTheme) {
            localStorage.setItem("theme", savedTheme);
        }

        sessionStorage.clear();

        if (window.caches) {
            caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
        }

        markdownSource.set(defaultTemplate);

        toastNotification("Data cleared!");
    }

    const shortcuts = {
        e: menuEdit,
        s: menuSaveAsSvg,
        h: menuSaveAsHtml,
        l: menuShare,
        m: () => (showMenu = !showMenu),
        t: theme.toggle
    };

    function handleKeydown(event) {
        // Leave browser shortcuts (Cmd/Ctrl+S, Cmd/Ctrl+L…) alone
        if (event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }
        if ($show) {
            if (event.key === "Escape") {
                menuView();
            }
        } else if (Object.hasOwn(shortcuts, event.key)) {
            // Keeps the "e" that opened the editor from being typed into it
            event.preventDefault();
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

<svelte:window on:keydown={handleKeydown} on:beforeunload={beforeunload} />
{#if showMenu}
    <div
        class="menu-container"
        in:fly={{ y: 20, duration: 400, easing: quintOut }}
    >
        <nav id="menu" class:edit-mode={$show}>
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
                <button on:click|preventDefault={menuSaveAsHtml} class="menu-btn" aria-label="Save as HTML" title="Save as HTML — still interactive (h)">
                    <i class="fas fa-file-code"></i>
                </button>
                <button on:click|preventDefault={menuSaveAsSvg} class="menu-btn" aria-label="Save as SVG" title="Save as SVG — static image (s)">
                    <i class="fas fa-file-arrow-down"></i>
                </button>
                <button on:click|preventDefault={menuShare} class="menu-btn" aria-label="Copy a sharing link" title="Copy a sharing link (l)">
                    <i class="fas fa-link"></i>
                </button>
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

            <div class="eraser-container">
                {#if $show}
                    <button
                        on:click|preventDefault={menuReset}
                        transition:fade={{ duration: 200 }}
                        class="menu-btn"
                        aria-label="Clear mind map and browser cache"
                        title="Clear mind map and browser cache"
                    >
                        <i class="fas fa-eraser" style="color: #d360d4;"></i>
                    </button>
                {/if}
            </div>
        </nav>

        {#if showNotification}
            <div
                id="shareNotification"
                in:fly={{ y: 5, duration: 1000}}
                out:fade
            >
                {notificationMessage}
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

    .eraser-container {
        display: flex;
        justify-content: center;
    }
    
    .eraser-container i {
        display: flex;
        justify-content: center;
    }

    .edit-mode {
        transition: width 0.2s ease-in-out;
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