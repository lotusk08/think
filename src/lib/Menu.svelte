<script>
    import {
        show,
        baseURL,
        mindmapSaveAsSvg,
        mindmapSaveAsHtml,
        markdownSource,
        defaultTemplate,
        theme,
    } from "./stores.js";
    export let source;
    export let disableWarningMessage;
    import url from "./url.js";
    import { fade, fly, slide } from "svelte/transition";
    import { quintOut, elasticOut } from "svelte/easing";
    import { saveAs } from "file-saver-es";
    import { onMount } from "svelte";

    export let showMenu;

    let urlToShare;
    let encodageHash;
    let menu;
    let currentTheme;

    // Subscribe to theme changes
    theme.subscribe(value => {
        currentTheme = value;
    });

    function toggleTheme() {
        theme.toggle();
    }

    function menuEdit() {
        showNotification = false;
        show.update((n) => true);
    }

    function menuView() {
        show.update((n) => false);
    }

    function menuSaveAsSvg() {
        mindmapSaveAsSvg.update((n) => true);
    }

    function menuSaveAsHtml() {
        mindmapSaveAsHtml.update((n) => true);
    }

    function menuHide() {
        showMenu = showMenu ? false : true;
    }
    if ($url && $url.searchParams && $url.searchParams.get("m") == 0) {
        showMenu = false;
    }

    function menuShare() {
        toastNotification();
        encodageHash = encodeURI(source);
        urlToShare = $baseURL + "/#" + encodageHash;
        navigator.clipboard.writeText(urlToShare);
    }

    function menuReset() {
        markdownSource.update((content) => defaultTemplate);
    }

    function handleKeydown(event) {
        if (!$show) {
            if (event.key === "e") {
                event.preventDefault();
                menu.style.display = "flex";
                menuEdit();
            }
            if (event.key === "s") {
                menu.style.display = "flex";
                menuSaveAsSvg();
            }
            if (event.key === "h") {
                menu.style.display = "flex";
                menuSaveAsHtml();
            }
            if (event.key === "l") {
                menu.style.display = "flex";
                menuShare();
            }
            if (event.key == "m") {
                menuHide();
            }
            if (event.key == "t") {
                toggleTheme();
            }
        } else {
            if (event.key === "Escape") {
                menu.style.display = "flex";
                menuView();
            }
        }
    }

    function beforeunload(event) {
        if (!disableWarningMessage) {
            event.preventDefault();
            return (event.returnValue = "");
        }
    }

    let showNotification = false;

    function toastNotification() {
        showNotification = true;
        setTimeout(function () {
            showNotification = false;
        }, 1500);
    }
</script>

<svelte:window on:keydown={handleKeydown} on:beforeunload={beforeunload} />
{#if showMenu}
    <div
        class="menu-container"
        in:fly={{ y: 20, duration: 400, easing: quintOut }}
    >
        <nav id="menu" bind:this={menu} class:edit-mode={$show}>
            <div class="menu-items">
                {#if $show}
                    <button href="#edit" on:click|preventDefault={menuView} class="menu-btn">
                        <i class="fas fa-eye"></i>
                    </button>
                {:else}
                    <button href="#edit" on:click|preventDefault={menuEdit} class="menu-btn">
                        <i class="fas fa-pen"></i>
                    </button>
                {/if}
                <button href="#saveHTML" on:click|preventDefault={menuSaveAsHtml} class="menu-btn">
                    <i class="fas fa-file-code"></i>
                </button>
                <button href="#saveSVG" on:click|preventDefault={menuSaveAsSvg} class="menu-btn">
                    <i class="fas fa-file-arrow-down"></i>
                </button>
                <button href="#share" on:click|preventDefault={menuShare} class="menu-btn">
                    <i class="fas fa-link"></i>
                </button>
                <button
                    class="theme-toggle menu-btn"
                    on:click={toggleTheme}
                    on:keydown={(e) => e.key === 'Enter' && toggleTheme()}
                    aria-label={currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                    title={currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                >
                    {#if currentTheme === "light"}
                        <i class="fas fa-moon"></i>
                    {:else}
                        <i class="fas fa-sun"></i>
                    {/if}
                </button>
            </div>

            <div class="eraser-container">
                {#if $show}
                    <button
                        href="#reset"
                        on:click|preventDefault={menuReset}
                        transition:fade={{ duration: 200 }}
                        class="menu-btn"
                    >
                        <i class="fas fa-eraser"></i>
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
                Link copied!
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
        padding: 0.35rem 1rem;
        gap: 0.25rem;
        border-radius: 8px;
        background-color: var(--menu-bg);
        backdrop-filter: blur(5px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
    }

    .menu-items {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .eraser-container {
        display: flex;
        justify-content: center;
    }

    .edit-mode {
        transition: width 0.2s ease-in-out;
    }

    #menu:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
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
        border-radius: 6px;
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
        color: var(--icon-hover);
    }

    .theme-toggle, .theme-reset {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        color: inherit;
        outline: none;
    }

    .theme-toggle:focus-visible, .theme-reset:focus-visible {
        outline: 2px solid var(--icon-hover);
        border-radius: 5px;
    }

    #shareNotification, #themeNotification {
        position: absolute;
        bottom: 3.5em;
        padding: 0.75em 1.25em;
        backdrop-filter: blur(5px);
        background-color: var(--menu-bg);
        color: var(--text-color);
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
        font-size: 14px;
        font-weight: 500;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", Inter, Ubuntu, "Liberation Sans", sans-serif, "Source Code Pro", "SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace;
    }

    @media screen and (max-width: 768px) {
        #menu {
            position: fixed;
            bottom: 1em;
            left: 50%;
            transform: translateX(-50%);
        }
        
        #shareNotification, #themeNotification {
            position: fixed;
            bottom: 5em;
            left: 50%;
            transform: translateX(-50%);
        }
    }
</style>