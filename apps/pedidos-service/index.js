const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://devuser:devpassword@localhost:5432/loja_veloz';

// Conexão com PostgreSQL com fallback em memória para desenvolvimento rápido
let pool;
const pedidosEmMemoria = [];

try {
  pool = new Pool({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
} catch (e) {
  console.log('[PEDIDOS] Usando armazenamento em memória');
}

// 1. Probes de Saúde (Kubernetes Liveness / Readiness)
app.get('/healthz', (req, res) => res.status(200).json({ status: 'UP', service: 'pedidos-service' }));
app.get('/ready', (req, res) => res.status(200).json({ status: 'READY', service: 'pedidos-service' }));

// 2. Métrica Básica de Observabilidade
let totalPedidosCriados = 0;
app.get('/metrics', (req, res) => {
  res.type('text/plain').send(`# HELP pedidos_total Total de pedidos\n# TYPE pedidos_total counter\npedidos_total ${totalPedidosCriados}\n`);
});

// 3. Endpoints de Negócio (Aceita tanto / quanto /pedidos)
app.get(['/', '/pedidos'], async (req, res) => {
  if (pool) {
    try {
      const dbRes = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
      return res.json(dbRes.rows);
    } catch (err) { /* Fallback */ }
  }
  res.json(pedidosEmMemoria);
});

app.post(['/', '/pedidos'], async (req, res) => {
  const { cliente, total, itens } = req.body;
  if (!cliente || !total) return res.status(400).json({ error: 'cliente e total são obrigatórios' });

  const novoPedido = {
    id: `ped-${Date.now()}`,
    cliente,
    total: parseFloat(total),
    itens: itens || [],
    status: 'CRIADO',
    criado_em: new Date().toISOString()
  };

  pedidosEmMemoria.push(novoPedido);
  totalPedidosCriados++;

  if (pool) {
    try {
      await pool.query(
        'INSERT INTO pedidos(id, cliente, total, status) VALUES($1, $2, $3, $4)',
        [novoPedido.id, novoPedido.cliente, novoPedido.total, novoPedido.status]
      );
    } catch (err) { /* Fallback em memória já executado */ }
  }

  console.log(`[PEDIDOS] Pedido criado com sucesso: ${novoPedido.id}`);
  res.status(201).json(novoPedido);
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[PEDIDOS-SERVICE] Rodando na porta ${PORT}`));
}

module.exports = app;
