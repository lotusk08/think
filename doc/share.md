Once you have created your mind map, you can share or save it in several ways.

### Recommended option: host the Markdown file

It is a good idea to store the text of your mind map somewhere so you can edit it later — for example on [Stackedit](https://stackedit.io), in Obsidian, or in a Git repository. Whichever you choose, the Markdown file has to be reachable publicly through a URL.

Your mind map is then available at: `https://think.stevehoang.com/#URL` (replacing `URL` with the address where your Markdown file is hosted).

The advantage is that you can change your mind map at any time by editing the Markdown file, without the mind map URL ever changing.

If the file cannot be fetched directly, try routing it through a CORS proxy: `https://think.stevehoang.com/#https://corsproxy.io/%3FURL`

### Other sharing options

You can also:
- save the mind map as an _svg_ file (static image) or as an _html_ file (still interactive), using the two save icons in the menu
- copy a quick sharing link for your mind map (link icon)

### Hiding the menu

You can hide the menu by adding the `?m=0` parameter to the URL: `https://think.stevehoang.com/?m=0#URL_OF_YOUR_FILE`

You can also set this by default in your Markdown text, in the YAML header, with the line: `showMenu: false`

Finally, you can use the `m` keyboard shortcut to hide or show the menu bar.
