import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import mkcert from 'vite-plugin-mkcert'
import svgr from 'vite-plugin-svgr'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'

export const manifest: Partial<ManifestOptions> = {
    id: '/',
    name: 'КтоКому',
    short_name: 'КтоКому',
    description: 'КтоКому',
    lang: 'ru-RU',
    dir: 'auto',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#2563eb',
    background_color: '#f2f2f2',
    icons: [
        {
            purpose: 'maskable',
            sizes: '512x512',
            src: '/pwa/icon512_maskable.png',
            type: 'image/png',
        },
        {
            purpose: 'any',
            sizes: '512x512',
            src: '/pwa/icon512_rounded.png',
            type: 'image/png',
        },
    ],
    // screenshots: [
    //     {
    //         src: '/pwa/screenshots/mobile.png',
    //         type: 'image/png',
    //         sizes: '567x1138',
    //         form_factor: 'narrow',
    //     },
    //     {
    //         src: '/pwa/screenshots/desktop.png',
    //         type: 'image/png',
    //         sizes: '1474x1132',
    //         form_factor: 'wide',
    //     },
    // ],
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        mkcert(),
        reactRouter(),
        svgr(),
        VitePWA({
            registerType: 'autoUpdate',
            outDir: 'build/client',
            manifest,
            devOptions: {
                enabled: true,
                type: 'classic',
            },
            // injectRegister: 'script',
            // immediate: true,
            workbox: {
                globDirectory: 'build/client',
                globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff2}'],
                additionalManifestEntries: [
                    {
                        url: 'index.html',
                        revision: Date.now().toString(),
                    },
                ],
                navigateFallbackDenylist: [/^\/api\//],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith('/api/'),
                        handler: 'NetworkOnly',
                        options: {
                            cacheName: 'api-network-only',
                        },
                    },
                    {
                        urlPattern: ({ request }) =>
                            request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },
                ],
            },
        }),
    ],
    server: {
        https: true,
        host: true,
    },
})
