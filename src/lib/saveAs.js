// Minimal replacement for file-saver-es.
//
// That package is unmaintained and ships a dual-package hazard: its "main" is a
// CommonJS/UMD bundle exposing only a default export, while its "module" entry is
// ESM exposing only a named `saveAs`. Vite resolves "main" for SSR and "module"
// for the browser, so no single import form satisfies both.
//
// Everything we need is a Blob/File plus an anchor with the download attribute.

export function saveAs(blob, filename) {
	const name = filename || blob.name || "download";
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");

	anchor.href = url;
	anchor.download = name;
	anchor.rel = "noopener";
	anchor.style.display = "none";

	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);

	// Give the browser time to start the download before releasing the URL
	setTimeout(() => URL.revokeObjectURL(url), 40000);
}
