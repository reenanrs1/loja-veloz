const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Probes de Saúde
app.get('/healthz', (req, res) => res.status(200).json({ status: 'UP', service: 'pagamentos-service' }));
app.get('/ready', (req, res) => res.status(200).json({ status: 'READY', service: 'pagamentos-service' }));

// Métrica simples para Observabilidade
let pagamentosProcessados = 0;
app.get('/metrics', (req, res) => {
  res.type('text/plain').send(`# HELP pagamentos_total Total de pagamentos\n# TYPE pagamentos_total counter\npagamentos_total ${pagamentosProcessados}\n`);
});

// Processamento de Pagamento (Mock de Integração Externa)
app.post(['/', '/processar', '/pagamentos', '/pagamentos/processar'], (req, res) => {
  const { pedidoId, valor, metodo } = req.body;
  if (!pedidoId || !valor) return res.status(400).json({ error: 'pedidoId e valor são obrigatórios' });

  pagamentosProcessados++;
  const transacao = {
    transacaoId: `tx-${Date.now()}`,
    pedidoId,
    valor,
    metodo: metodo || 'CARTAO',
    status: 'APROVADO',
    data: new Date().toISOString()
  };

  console.log(`[PAGAMENTOS] Transação aprovada para pedido ${pedidoId}: ${transacao.transacaoId}`);
  res.status(200).json(transacao);
});

app.get(['/', '/pagamentos'], (req, res) => res.json({ status: 'operacional', totalProcessados: pagamentosProcessados }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`[PAGAMENTOS-SERVICE] Rodando na porta ${PORT}`));
}

module.exports = app;
