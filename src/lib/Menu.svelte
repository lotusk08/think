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

    export let showMenu;

    let urlToShare;
    let encodageHash;
    let menu;

    function toggleTheme() {
        $theme = $theme === "light" ? "dark" : "light";
        document.body.setAttribute("data-theme", $theme);
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
                    <a href="#edit" on:click|preventDefault={menuView}>
                        <span class="menu-btn">
                            <i class="fas fa-eye"></i>
                        </span>
                    </a>
                {:else}
                    <a href="#edit" on:click|preventDefault={menuEdit}>
                        <span class="menu-btn">
                            <i class="fas fa-pen"></i>
                        </span>
                    </a>
                {/if}
                <a href="#saveHTML" on:click|preventDefault={menuSaveAsHtml}>
                    <span class="menu-btn"
                        ><i class="fas fa-file-code"></i></span
                    >
                </a>
                <a href="#saveSVG" on:click|preventDefault={menuSaveAsSvg}>
                    <span class="menu-btn"
                        ><i class="fas fa-file-arrow-down"></i></span
                    >
                </a>
                <a href="#share" on:click|preventDefault={menuShare}>
                    <span class="menu-btn"><i class="fas fa-link"></i></span>
                </a>
                <span class="theme-toggle menu-btn" on:click={toggleTheme}>
                    {#if $theme === "light"}
                        <i class="fas fa-moon"></i>
                    {:else}
                        <i class="fas fa-sun"></i>
                    {/if}
                </span>
            </div>

            <div class="eraser-container">
                {#if $show}
                    <a
                        href="#reset"
                        on:click|preventDefault={menuReset}
                        transition:fade={{ duration: 200 }}
                    >
                        <span class="menu-btn"
                            ><i class="fas fa-eraser"></i></span
                        >
                    </a>
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
        padding: 0.1rem 0.75rem;
        border-radius: 10px;
        background-color: var(--menu-bg);
        backdrop-filter: blur(5px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }

    .menu-items {
        display: flex;
        gap: 0.5em;
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

    #menu a {
        text-decoration: none;
    }

    .menu-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 2.5em;
        height: 2.5em;
        border: none;
        background-color: transparent;
        transition: all 0.2s ease;
    }

    .menu-btn i {
        color: var(--icon-color);
        font-size: 1rem;
        transition: all 0.2s ease;
    }

    .menu-btn:hover {
        transform: translateY(-2px);
    }

    .menu-btn:hover i {
        color: var(--icon-hover);
    }

    .theme-toggle {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
    }

    #shareNotification {
        position: absolute;
        bottom: 3.5em;
        padding: 0.75em 1.25em;
        backdrop-filter: blur(5px);
        background-color: var(--menu-bg);
        color: var(--text-color);
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
        font-size: 14px;
        font-weight: 500;

        font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter,
            Ubuntu, sans-serif;
    }

    @media screen and (max-width: 768px) {
        #menu {
            position: fixed;
            bottom: 1.5em;
            left: 50%;
            transform: translateX(-50%);
        }
    }
</style>
