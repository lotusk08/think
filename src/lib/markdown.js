const H2_SPAN = '<span style="font-weight:bold; font-size:1em; display:block; padding-bottom:0.3em"><br>';
const H1_SPAN = '<span style="font-weight:bold; font-size:1.3em; display:block; padding-bottom:0.6em"><br>';

// Rewrites the app's Markdown dialect into what markmap renders
export function replaceMarkdown(md) {
	// Hide the # of headings written inside inline code from the rules below
	md = md.replace(/`(#+)/g, (_, hashes) => "`" + "@hash".repeat(hashes.length));
	// Headings of level 3 and more: their own paragraph, plus a line break after a blank line
	md = md.replace(/\n(\n?)(#{3,6}) /g, (_, blank, hashes) => "\n\n" + "@hash".repeat(hashes.length) + (blank ? " <br>" : " "));
	// Level 2 and level 1 headings
	md = md.replace(/## (\\\\+)*(.*)(?:\n|$)/g, "@hash@hash $1" + H2_SPAN + "$2</span>\n");
	md = md.replace(/# (.*)(?:\n|$)/g, "@hash " + H1_SPAN + "$1</span>\n");
	// Bullet lists
	md = md.replace(/\n\n- /g, "\n\n- <br>");
	md = md.replace(/\n\n\* /g, "\n\n* <br>");
	// Lines ending with inline code
	md = md.replace(/`\n/g, '`\n<span style="display:block; height:0.2em!important"><br></span>\n');
	md = md.replace(/@hash/g, "#");
	// \\ is a shortcut for <br>, except inside `\\`
	md = md.replace(/`\\\\`/g, "`@anti_slash@anti_slash`");
	md = md.replace(/\\\\/g, "<br>");
	md = md.replace(/@anti_slash/g, "\\");
	// {{text}} hides text until clicked, except inside `{{ }}`
	md = md.replace(/`{{/g, "`@accolade_G@accolade_G");
	md = md.replace(/}}`/g, "@accolade_D@accolade_D`");
	md = md.replace(/{{(.*?)}}/g, '<span class="hide">$1</span>');
	md = md.replace(/class="hide"/g, 'class="hide" onclick="event.preventDefault(); this.classList.toggle(\'hide\');"');
	md = md.replace(/@accolade_G/g, "{");
	md = md.replace(/@accolade_D/g, "}");
	// Non-breaking spaces
	md = md.replace(/ /g, "&nbsp;");
	// Images: the height can be given in the alt text, e.g. ![h-50](url)
	md = md.replace(/!\[h-(.*?)\]\((.*?)\)/g, '<img src="$2" height=$1 />');
	// <!--fold--> magic comment
	md = md.replace(/([^`])<!--fold-->(<\/span>)?/g, "$1$2<!-- markmap: fold -->");
	return md;
}

export function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
