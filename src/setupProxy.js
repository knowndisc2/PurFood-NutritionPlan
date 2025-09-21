const { createProxyMiddleware } = require('http-proxy-middleware');

// CRA dev-only proxy to backend on :4000 for API and WS endpoints
module.exports = function(app) {
  // REST API
  app.use(
    ['/api', '/auth', '/fb', '/scrape'],
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      logLevel: 'warn',
    })
  );

  // WebSockets (if backend serves a /ws endpoint)
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      ws: true,
      logLevel: 'warn',
    })
  );
};
