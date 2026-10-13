import emojis from "virtual:emoji-table";

// Replaces :shortcodes: with their emoji, like node-emoji's emojify
export function emojify(text) {
	return text.replace(/:[\w\-+]+:/g, (code) => emojis.get(code.slice(1, -1)) ?? code);
}
