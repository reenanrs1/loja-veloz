const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware de Tracing Distribuído (Correlation ID via Header)
app.use((req, res, next) => {
  const correlationId = req.headers['x-request-id'] || `req-${Date.now()}`;
  req.headers['x-request-id'] = correlationId;
  res.setHeader('X-Request-ID', correlationId);
  next();
});

// Probes de Saúde (Liveness & Readiness para Kubernetes)
app.get('/healthz', (req, res) => res.status(200).json({ status: 'UP', service: 'api-gateway' }));
app.get('/ready', (req, res) => res.status(200).json({ status: 'READY', service: 'api-gateway' }));

// Métrica simples para Observabilidade (Prometheus format)
let totalRequests = 0;
app.use((req, res, next) => { totalRequests++; next(); });
app.get('/metrics', (req, res) => {
  res.type('text/plain').send(`# HELP gateway_requests_total Total de requisicoes\n# TYPE gateway_requests_total counter\ngateway_requests_total ${totalRequests}\n`);
});

// Roteamento dos Microsserviços (Stream proxy puro)
const PEDIDOS_URL = process.env.PEDIDOS_SERVICE_URL || 'http://pedidos-service:3000';
const PAGAMENTOS_URL = process.env.PAGAMENTOS_SERVICE_URL || 'http://pagamentos-service:3001';
const ESTOQUE_URL = process.env.ESTOQUE_SERVICE_URL || 'http://estoque-service:3002';

app.use(createProxyMiddleware({ 
  pathFilter: '/api/pedidos',
  target: PEDIDOS_URL, 
  changeOrigin: true, 
  pathRewrite: { '^/api/pedidos': '/pedidos' }
}));

app.use(createProxyMiddleware({ 
  pathFilter: '/api/pagamentos',
  target: PAGAMENTOS_URL, 
  changeOrigin: true, 
  pathRewrite: { '^/api/pagamentos': '/pagamentos' }
}));

app.use(createProxyMiddleware({ 
  pathFilter: '/api/estoque',
  target: ESTOQUE_URL, 
  changeOrigin: true, 
  pathRewrite: { '^/api/estoque': '/estoque' }
}));

app.get('/', (req, res) => res.json({ message: 'API Gateway Loja Veloz Operacional', rotas: ['/api/pedidos', '/api/pagamentos', '/api/estoque', '/healthz', '/metrics'] }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`[API-GATEWAY] Rodando na porta ${PORT}`));
}

module.exports = app;
