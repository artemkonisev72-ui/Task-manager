import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Task Manager PWA',
				short_name: 'TaskManager',
				description: 'A minimalist task manager progressive web app',
				theme_color: '#000000',
				background_color: '#fafafa',
				display: 'standalone',
				icons: [
					{
						src: 'favicon.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'favicon.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			}
		})
	],
	server: {
		allowedHosts: ['swift-ghosts-jump.loca.lt']
	}
});
