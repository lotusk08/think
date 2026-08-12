### Basic navigation

Click the circles at the intersection of branches to show or hide the rest.

Drag with the mouse to move around the mind map.

You can also zoom with the mouse wheel, or by pinching on a touch screen.

### Expanding and folding branches

You can set the initial expansion level of the branches in the YAML header with `initialExpandLevel: n` (where n is the depth level).

You can also hide the sub-branches of a node by adding `<!--fold-->` at the end of the corresponding line in the Markdown text.

By default the mind map is automatically resized to fit the window.

You can turn this off by adding the line `automaticResize: false` to the YAML header, or by pressing the `r` key to toggle automatic resizing. On mobile, double-tap anywhere on the mind map to toggle it.

### Focusing on a branch

_Command+click_ (macOS) or _Alt+click_ (Windows and Linux) on a circle shows only the sub-branches of that circle.

You can also enable this behaviour by default by adding the line `focusOnBranch: true` to the YAML header.

### Hiding the text of a branch

You can hide the text of a branch by _Command+click_ (macOS) or _Alt+click_ (Windows and Linux) on it, or by using the `{{hidden text}}` syntax in the Markdown.
