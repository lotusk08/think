import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: null,
      precompress: false,
      strict: true,
    }),
    prerender: {
      handleMissingId: "ignore",
    },
  },
};

export default config;
