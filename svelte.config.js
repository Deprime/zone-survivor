import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const mdsvexOptions = {
	extensions: ['.md', '.svx'],
	// Default layout that wraps the rendered markdown of legal pages.
	// Must be an absolute path — mdsvex otherwise resolves it relative
	// to each markdown file.
	layout: {
		_: join(__dirname, 'src/lib/layouts/legal.svelte')
	}
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Treat .svelte, .svx and .md files as components/routes.
	extensions: ['.svelte', '.svx', '.md'],
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
	kit: {
		adapter: adapter()
	}
};

export default config;
