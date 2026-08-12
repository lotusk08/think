You can configure the appearance of your mind map with several options in the YAML header of your Markdown text.

### Themes and styles

Several themes are available: `nolines`, `focus`, `default`, `black`.
Enable one with the option `theme: theme_name`.

Think tree also follows your system's light or dark mode, and you can switch manually with the moon/sun icon or the `t` key.

You can add your own CSS with the option `style: CSS_code`, or across multiple lines with a `style: |` block followed by the CSS indented from the next line onwards.

```
style: |
  /* your CSS here */
```

### Branches

To set how deep the branches are expanded at first, use `initialExpandLevel: n` (where n is the depth level).

To stop each line from growing past a given width, add `maxWidth: number_of_pixels` (`mw` also works as a shorthand).
To make every sub-branch share the same colour from a given level onwards, use `colorFreezeLevel: level_at_which_colours_freeze`.

If you prefer straight lines rather than curves between nodes, add the option `curves: false`.

To give the map a title (used when saving), add `title: My title`.
