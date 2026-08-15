const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Inventário em memória
const estoque = [
  { id: 'prod-001', nome: 'Camiseta Loja Veloz Tech', quantidade: 150 },
  { id: 'prod-002', nome: 'Caneca DevOps Cloud', quantidade: 300 },
  { id: 'prod-003', nome: 'Squeeze Kubernetes Native', quantidade: 75 }
];

// Probes de Saúde
app.get('/healthz', (req, res) => res.status(200).json({ status: 'UP', service: 'estoque-service' }));
app.get('/ready', (req, res) => res.status(200).json({ status: 'READY', service: 'estoque-service' }));

// Métrica simples
let totalReservas = 0;
app.get('/metrics', (req, res) => {
  res.type('text/plain').send(`# HELP reservas_total Total de reservas de estoque\n# TYPE reservas_total counter\nreservas_total ${totalReservas}\n`);
});

// Endpoints
app.get(['/', '/estoque'], (req, res) => res.json(estoque));

app.post(['/reservar', '/estoque/reservar'], (req, res) => {
  const { produtoId, quantidade } = req.body;
  const item = estoque.find(p => p.id === produtoId);

  if (!item) return res.status(404).json({ error: 'Produto não encontrado' });
  if (item.quantidade < (quantidade || 1)) return res.status(400).json({ error: 'Estoque insuficiente' });

  item.quantidade -= (quantidade || 1);
  totalReservas++;

  console.log(`[ESTOQUE] Reservado ${quantidade || 1}x do item ${produtoId}. Restante: ${item.quantidade}`);
  res.json({ status: 'RESERVADO', produtoId, quantidadeRestante: item.quantidade });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[ESTOQUE-SERVICE] Rodando na porta ${PORT}`));
}

module.exports = app;
