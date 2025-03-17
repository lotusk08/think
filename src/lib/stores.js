import { writable } from "svelte/store";

export const show = writable(false);
export const defaultTemplate = `---
maxWidth: 300
---

# Title
`;

export const markdownSource = writable(
  decodeURI(`---
maxWidth: 600
---

# Think tree

## A free and \\ open-source tool

### [Sources](https://forge.apps.education.fr/myMarkmap/myMarkmap.forge.apps.education.fr) on the Forge des\\Communs Numériques Éducatifs
### _Author_: [Cédric Eyssette](https://eyssette.forge.apps.education.fr/)
### Built from the \\ [markmap](https://markmap.js.org/) software

## For creating \\ mind maps

- Click on ✒️ in the top left to **edit** \\ your mind map (_keyboard shortcut: \`e\`_) \\ Markdown is used to create branches
  - \`# Title\` for level 1
  - \`## Subtitle\` for level 2
  - \`### Level 3\`, \`#### Level 4\` …
  - Or use a bulleted list \\ \`- Level 3\` \\ 　\`  - Level 4\` \\ \`- Level 3\` \\ (add 2 spaces before \\ to move to another level)
- Click on 👓 to **hide** the editing window \\ and view only the mind map \\ (_keyboard shortcut: \`Escape\`)
- **Save** and \\ share your \\ mind map
  - Click on 💾 to **save** the map as an _svg_ file \\ [static image] (_keyboard shortcut: \`s\`)
  - Click on 🌐 to **save** as an HTML file \\ [with interactivity] (_keyboard shortcut: \`h\`)
  - Click on 🔗 to copy a **sharing link** \\ for the mind map (_keyboard shortcut: \`l\`)
    - Add \`?m=0\` to the URL to hide the menu
  - It’s recommended to save the text \\ of your mind map somewhere so \\ you can edit it later
    - You can store your text \\ **on a forge** or on [CodiMD](https://codimd.apps.education.fr) \\ and display it with myMarkmap <!--fold-->
      - \\ \`https://mymarkmap.vercel.app/#URL\`
      - In case of issues: \\ \`https://mymarkmap.vercel.app/#https://corsproxy.io/%3FURL\`
      - On a Gitlab instance, use a \`.gitlab-ci.yml\` file to publish the md file on a public page and use that address as the URL

## How to navigate \\ the map?
- \\\\ Click on the **circles** at the intersection \\ of branches to show or hide the rest
  - \\ **Alt+click** on a circle to display \\ only that specific branch
- **Other shortcuts**
  - **Alt+click** on branch text to hide it
  - \`m\` to hide or show the menu bar
  - \`r\` to disable or enable automatic resizing

## More advanced \\ uses  <!--fold-->

### Tags to \\ **control the display** \\ of the map

#### **Markdown**  <!--fold-->

- \`**text**\`: to make text **bold**
- \`_text_\`: to make text _italic_
- \`[link](URL)\`: to insert a [link](https://eyssette.forge.apps.education.fr/)
- \`![](URL)\`: to insert an image
  - \`![h-25](URL)\`: to specify \\ the image height (in pixels)
- \`\`\` \`code\` \`\`\`: To insert \`code\`
- \`==text==\`: To highlight ==text==
- \`++text++\`: To underline ++text++

#### **HTML** <!--fold-->

- \`<br>\` or \`\\\\\` to force a line break
- \`<span style="...">text</span>\` \\ to change the style of an element

#### **Other \\ tags** <!--fold-->

- \`<!--fold-->\` at the end of a line to hide \\ sub-branches by default: \\ click the circle to show the rest <!--fold-->
  - This branch is hidden by default!
  - This one too!
- \`:code_emoji:\`: to insert an emoji code [:link:](https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json)
- \`{{hidden part}}\` to hide part \\ of the text: here’s an example with a {{passage}} hidden \\ (click to show/hide)

### A **header** (YAML) \\ for advanced \\ configuration options <!--fold-->

- To specify the maximum \\ width of a branch
  - \`\`\`maxWidth: 300\`\`\`
- To prevent color changes \\ for sub-branches beyond \\ a certain level
  - \`\`\`colorFreezeLevel: 2\`\`\` \\ (so each branch \\ has its own color)
- To add specific \\ CSS styles
  - \`\`\`style: strong{color:red}\`\`\`
- To apply a \\ specific theme
  - \`\`\`theme: focus\`\`\`
  - Available themes: \\ \`focus\`, \`nolines\`, and \`black\`
- To use straight lines \\ instead of curves
  - \`\`\`curves: false\`\`\`
- To add a title
  - \`\`\`title: My title\`\`\`
- To hide sub-branches \\ by default beyond \\ a certain level
  - \`\`\`initialExpandLevel: 1\`\`\`
- To force links to open \\ in a new tab
  - \`\`\`openLinksInNewTab: true\`\`\`
- To enable automatic link \\ opening and disable the \\ confirmation message when leaving
  - \`\`\`disableWarningMessage: true\`\`\`
- To control interactivity
  - \`\`\`automaticResize: false\`\`\` \\ to disable \\ automatic resizing
  - \`\`\`focusOnBranch: true\`\`\` \\ to focus on the clicked branch \\ and auto-close others
  - \`\`\`showMenu: false\`\`\` \\ to hide the menu
`)
);

export const baseURL = writable("");
export const mindmapSaveAsSvg = writable(false);
export const mindmapSaveAsHtml = writable(false);
export const wValue = writable();
export const hValue = writable();
