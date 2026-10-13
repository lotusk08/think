// Stand-in for the `yaml` package (aliased in vite.config.js), which markmap-lib
// only uses to parse front matter. The app already ships js-yaml, roughly half its
// size, so both share one parser.
export { load as parse } from "js-yaml";
