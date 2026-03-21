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
			devOptions: {
				enabled: true,
				type: 'module'
			},
			manifest: {
				name: 'Logistics Manager PWA',
				short_name: 'LogisticsManager',
				description: 'A minimalist logistics manager progressive web app',
				theme_color: '#000000',
				background_color: '#fafafa',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: 'pwa-192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'pwa-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			}
		})
	],
	define: { 'import.meta.env.VITE_PUBLIC_BASE_URL': JSON.stringify('https://whoops.oops.wtf') },
	server: {
		host: '0.0.0.0',
		port: 4173,
		strictPort: false,
		allowedHosts: [
			'whoops.oops.wtf',
			'oops.wtf',
			'0.0.0.0',
			'localhost',
			'127.0.0.1'
		]
	},
	preview: {
		host: '0.0.0.0',
		port: 4173,
		strictPort: false,
		allowedHosts: [
			'whoops.oops.wtf',
			'oops.wtf',
			'0.0.0.0',
			'localhost',
			'127.0.0.1'
		]
	}
});
