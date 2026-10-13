const CORS_PROXY = "https://corsproxy.io/?url=";

// Turns a link to a hosted document into a URL its raw Markdown can be fetched from:
// known hosts expose a raw/export endpoint, anything else goes through a CORS proxy.
export function toFetchableURL(url) {
	// GitHub
	if (url.startsWith("https://github.com")) {
		return url.replace("https://github.com", "https://raw.githubusercontent.com").replace("/blob/", "/");
	}
	// CodiMD / HedgeDoc / Digipage
	if (url.startsWith("https://codimd") || url.startsWith("https://pad.numerique.gouv.fr/") || url.includes("hedgedoc") || url.includes("digipage")) {
		url = url.replace("?edit", "").replace("?both", "").replace("?view", "").replace(/#$/, "").replace(/\/$/, "");
		return url.includes("download") ? url : url + "/download";
	}
	// Framapad
	if (url.includes("framapad") && !url.endsWith("/export/txt")) {
		return url.replace(/\?.*/, "") + "/export/txt";
	}
	return CORS_PROXY + url;
}
