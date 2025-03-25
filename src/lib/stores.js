import { writable } from "svelte/store";

// Define the initial demo content as a constant
export const initialDemoContent = decodeURI(`---
mw: 600
---

# Think tree

## A free and \\\\ open-source tool
* [Sources code](https://github.com/lotusk08/think)
* _Author_: [Steve Hoang](https://stevehoang.com)
* Built from the \\\\ [markmap](https://markmap.js.org/) software

## For creating \\\\ mind maps
- Click on <i class="fas fa-pen"></i> in the top left to **edit**
your mind map (_keyboard shortcut: \`e\`_)
Markdown is used to create branches
  - Heading
    - \`# Title\` for level 1
    - \`## Subtitle\` for level 2
    - \`### Level 3\`, \`#### Level 4\` …
  - Or use a bulleted list
    - \\\\ \`- Level 3\` \\\\ 　\`  - Level 4\` - add 2 spaces before to move to another level \\\\ \`- Level 3\`
- Click on <i class="fas fa-eye"></i> to **hide** the editing window \\ and view only the mind map \\\\ (_keyboard shortcut: \`Escape\`)
- **Save** and \\\\ share your \\\\ mind map
  - Click on <i class="fas fa-file-arrow-down"></i> to **save** the map as an _svg_ file \\\\ [static image] (_keyboard shortcut: \`s\`)
  - Click on <i class="fas fa-file-code"></i> to **save** as an HTML file \\\\ [with interactivity] (_keyboard shortcut: \`h\`)
  - Click on <i class="fas fa-link"></i> to copy a **sharing link** \\\\ for the mind map (_keyboard shortcut: \`l\`)
    - Add \`?m=0\` to the URL to hide the menu
  - You can store your text \\\\ on **Obsidian** or on [Stackedit](https://stackedit.io) \\\\ and display it with Think tree
    - It's recommended to save the text \\\\ of your mind map somewhere so \\\\ you can edit it later <!--fold-->
      - \\\\ \`https://think.stevehoang.com/#URL\`
      - In case of issues: \\\\ \`https://think.stevehoang.com/#https://corsproxy.io/%3FURL\`
      - On a Gitlab instance, use a \`.gitlab-ci.yml\` file to publish the md file on a public page and use that address as the URL
- Click on <i class="fas fa-eraser"></i> to **reset** the contents.
  -  All data from the current season will be **deleted**!

## How to navigate the map?
- \\\\ Click on the **circles** at the intersection \\\\ of branches to show or hide the rest
  - \\\\ **Command+click** on a circle to display \\\\\ only that specific branch
- **Other shortcuts**
  - **Command+click** on branch text to hide it
  - \`m\` to hide or show the menu bar
  - \`r\` to disable or enable automatic resizing
    - \`Mobile\` \\\\ Double-taps every where in mindmap \\\\ to enable automatic resizing
  - \`t\` to switch theme between light mode/dark mode

## More advanced uses  <!--fold-->

### Tags to \\\\ **control the display** \\\\ of the map

#### **Markdown**  <!--fold-->

- \`**text**\`: to make text **bold**
- \`_text_\`: to make text _italic_
- \`[link](URL)\`: to insert a [link](https://stevehoang.com)
- \`![](URL)\`: to insert an image
  - \`![h​-25](URL)\`: to specify \\\\ the image height (in pixels)
- \`\`\` \`code\` \`\`\`: To insert \`code\`
- \`==text==\`: To highlight ==text==
- \`++text++\`: To underline ++text++

#### **HTML** <!--fold-->

- \`<br>\` or \`\\\\\` to force a line break
- \`<span style="...">text</span>\` \\\\ to change the style of an element

#### **Other \\\\ tags** <!--fold-->

- \`<!--fold-->\` at the end of a line to hide \\\\ sub-branches by default: \\\\ click the circle to show the rest <!--fold-->
  - This branch is hidden by default!
  - This one too!
- \`:code_emoji:\`: to insert an emoji code [:heart:](https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json)
- \`{{hidden part}}\` to hide part \\\\ of the text: here's an example with a {{passage}} hidden \\\\ (click to show/hide)

### A **header** (YAML) \\\\ for advanced \\\\ configuration options <!--fold-->

- To specify the maximum \\\\ width of a branch
  - \`\`\`maxWidth: 300\`\`\` - precedence
  - \`\`\`mw: 300\`\`\`
- To prevent color changes \\\\for sub-branches beyond \\\\a certain level
  - \`\`\`colorFreezeLevel: 2\`\`\` \\\\ (so each branch \\\\has its own color)
- To add specific \\\\CSS styles
  - \`\`\`style: strong{color:red}\`\`\`
- To apply a \\\\ specific theme
  - \`\`\`theme: focus\`\`\`
  - Available themes: \\\\ \`focus\`, \`nolines\`, and \`black\`
- To use straight lines \\\\ instead of curves
  - \`\`\`curves: false\`\`\`
- To add a title
  - \`\`\`title: My title\`\`\`
- To hide sub-branches \\\\by default beyond \\\\ a certain level
  - \`\`\`initialExpandLevel: 1\`\`\`
- To force links to open \\\\in a new tab
  - \`\`\`openLinksInNewTab: true\`\`\`
- To enable automatic link \\\\opening and disable the \\\\confirmation message when leaving
  - \`\`\`disableWarningMessage: true\`\`\`
- To control interactivity
  - \`\`\`automaticResize: false\`\`\` \\\\to disable \\\\automatic resizing
  - \`\`\`focusOnBranch: true\`\`\` \\\\to focus on the clicked branch \\\\and auto-close others
  - \`\`\`showMenu: false\`\`\` \\\\to hide the menu
`);

function createThemeStore() {
  const { subscribe, set, update } = writable("light");

  function updateBrowserTheme(theme) {
    if (typeof window === "undefined") return;
    const themeColor = theme === "dark" ? "#1a1a1a" : "#FCFCF9";
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute("content", themeColor);
    }
  }

  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("theme");
    const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
    const initialTheme = savedTheme || (systemDarkMode.matches ? "dark" : "light");
    set(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    updateBrowserTheme(initialTheme);
    window.themeStore = { set };

    function handleThemeChange(e) {
      const newTheme = e.matches ? "dark" : "light";
      set(newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      updateBrowserTheme(newTheme);
    }

    try {
      systemDarkMode.removeEventListener("change", handleThemeChange);
    } catch (e) {
      console.warn("Could not remove media query listener");
    }

    try {
      systemDarkMode.addEventListener("change", handleThemeChange);
    } catch (e) {
      try {
        systemDarkMode.addListener(handleThemeChange);
      } catch (err) {
        console.warn("Could not add media query listener:", err);
      }
    }

    handleThemeChange(systemDarkMode);
  }

  return {
    subscribe,
    set: (value) => {
      set(value);
      if (typeof window !== "undefined" && value) {
        document.documentElement.setAttribute("data-theme", value);
        updateBrowserTheme(value);
      }
    },
    toggle: () => {
      update((theme) => {
        const newTheme = theme === "light" ? "dark" : "light";
        if (typeof window !== "undefined") {
          document.documentElement.setAttribute("data-theme", newTheme);
          updateBrowserTheme(newTheme);
        }
        return newTheme;
      });
    },
  };
}

export const theme = createThemeStore();
export const show = writable(false);
export const defaultTemplate = `---
mw: 300
---

# Title
`;
export const markdownSource = writable(initialDemoContent);
export const baseURL = writable("");
export const mindmapSaveAsSvg = writable(false);
export const mindmapSaveAsHtml = writable(false);
export const wValue = writable();
export const hValue = writable();