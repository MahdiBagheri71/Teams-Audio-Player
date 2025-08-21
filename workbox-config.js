
// workbox-config.js
module.exports = {
    globDirectory: 'build/',
    globPatterns: [
        '**/*.{css,js,html,png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot,ico,json}'
    ],
    swDest: 'build/sw.js',
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/login\.microsoftonline\.com\//,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'auth-cache',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 // 1 hour
                }
            }
        },
        {
            urlPattern: /^https:\/\/graph\.microsoft\.com\//,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'graph-api-cache',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 5 // 5 minutes
                }
            }
        },
        {
            urlPattern: /\.(?:mp3|wav|m4a|aac|ogg)$/,
            handler: 'CacheFirst',
            options: {
                cacheName: 'audio-files',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                }
            }
        },
        {
            urlPattern: /\.(?:png|jpg|jpeg|gif|svg)$/,
            handler: 'CacheFirst',
            options: {
                cacheName: 'image-cache',
                expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
            }
        }
    ],
    modifyURLPrefix: {
        '/static/': '/static/'
    },
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]
};
