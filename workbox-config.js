module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{html,js,css,png,svg,woff2}'],
  swDest: 'dist/sw.js',
  navigateFallback: '/offline.html',
  runtimeCaching: [
    {
      urlPattern: ({ request }) =>
        ['document', 'image', 'font'].includes(request.destination),
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'assets' },
    },
  ],
}
