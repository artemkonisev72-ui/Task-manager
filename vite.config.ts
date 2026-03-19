import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

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
				name: 'Task Manager PWA',
				short_name: 'TaskManager',
				description: 'A minimalist task manager progressive web app',
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
		}),
		basicSsl({
			domains: ['whoops.oops.wtf', 'localhost', '127.0.0.1']
		})
	],
	server: {
		host: '0.0.0.0',     // слушать все интерфейсы (внешний IP будет виден)
		port: 4173,          // твой желаемый порт, например 3000
		strictPort: false,   // если порт занят, попробовать следующий
		https: true,
		allowedHosts: [
			'whoops.oops.wtf',
			'oops.wtf',
			'0.0.0.0',      // или 'your_ip_here', или true
			'localhost',
			'127.0.0.1'
		]
	}
});
