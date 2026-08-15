# Loja Veloz - Plataforma de Pedidos em Microsserviços

Trabalho prático da disciplina **Cloud DevOps: Orchestrating Containers and Micro Services**.

Este projeto moderniza a infraestrutura de e-commerce, migrando de instâncias isoladas para microsserviços conteinerizados com Docker Compose no ambiente local, orquestração com Kubernetes em produção, pipeline de CI/CD no GitHub Actions e observabilidade.

---

## 📽️ Vídeo de Apresentação (Pitch de 4 Minutos)

- **Link do Vídeo no YouTube: https://youtu.be/G6Jm2hNczJU** ``

---

## 🏗️ Arquitetura dos Microsserviços

A aplicação foi dividida em 4 serviços leves em Node.js e um banco relacional:

1. **API Gateway (porta 8000):** Entrada principal da aplicação. Faz o roteamento HTTP, adiciona o Correlation ID (`X-Request-ID`) e expõe métricas.
2. **Serviço de Pedidos (porta 3000):** Cria e consulta pedidos de compra.
3. **Serviço de Pagamentos (porta 3001):** Simula o processamento financeiro.
4. **Serviço de Estoque (porta 3002):** Gerencia inventário e reserva de itens.
5. **PostgreSQL (porta 5432):** Banco de dados relacional com volume persistente.

```text
[Cliente / Postman]
         │
         ▼ (HTTP :8000)
   [API Gateway]
   ├──> /api/pedidos    ──> [pedidos-service :3000] ──> [PostgreSQL :5432]
   ├──> /api/pagamentos ──> [pagamentos-service :3001]
   └──> /api/estoque    ──> [estoque-service :3002]
```

---

## 🚀 Como Rodar Localmente (Docker Compose)

### 1. Subir todos os serviços com um único comando:
```bash
docker compose up --build -d
```

---

## 📬 Como Testar no Postman

### 1. Checar Saúde do Sistema (Healthcheck)
- **Método:** `GET`
- **URL:** `http://localhost:8000/healthz`
- **Resposta esperada:** `200 OK`
  ```json
  {
    "status": "UP",
    "service": "api-gateway"
  }
  ```

---

### 2. Criar Novo Pedido
- **Método:** `POST`
- **URL:** `http://localhost:8000/api/pedidos`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "cliente": "Renan",
    "total": 150.00,
    "itens": ["prod-001"]
  }
  ```
- **Resposta esperada:** `201 Created`

---

### 3. Listar Todos os Pedidos
- **Método:** `GET`
- **URL:** `http://localhost:8000/api/pedidos`
- **Resposta esperada:** `200 OK` (retorna o array de pedidos salvos)

---

### 4. Processar Pagamento
- **Método:** `POST`
- **URL:** `http://localhost:8000/api/pagamentos/processar`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "pedidoId": "ped-123",
    "valor": 150.00,
    "metodo": "CARTAO"
  }
  ```
- **Resposta esperada:** `200 OK` com `status: "APROVADO"`

---

### 5. Reservar Item no Estoque
- **Método:** `POST`
- **URL:** `http://localhost:8000/api/estoque/reservar`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "produtoId": "prod-001",
    "quantidade": 2
  }
  ```
- **Resposta esperada:** `200 OK` com `status: "RESERVADO"`

---

### 6. Consultar Métricas (Prometheus)
- **Método:** `GET`
- **URL:** `http://localhost:8000/metrics`
- **Resposta esperada:** `200 OK` (exibe contadores de requisições)

---

## ☸️ Implantação no Kubernetes

Todos os manifestos de produção estão na pasta `k8s/base/`. Para aplicar no cluster:

```bash
# Aplica Namespace, ConfigMaps, Secrets, Deployments, Services e HPA
kubectl apply -f k8s/base/

# Verificar se os pods e o HPA estão rodando:
kubectl get pods -n loja-veloz
kubectl get hpa -n loja-veloz
```

---

## 🧪 Como Rodar os Testes Unitários

```bash
node --test apps/pedidos-service/test/pedidos.test.js apps/pagamentos-service/test/pagamentos.test.js apps/estoque-service/test/estoque.test.js
```

---

## 📂 Estrutura de Pastas

```text
loja-veloz/
├── .github/workflows/deploy.yml          # Pipeline de CI/CD (GitHub Actions)
├── apps/
│   ├── api-gateway/                     # Gateway HTTP e métricas
│   ├── pedidos-service/                 # Serviço de Pedidos
│   ├── pagamentos-service/              # Serviço de Pagamentos
│   └── estoque-service/                 # Serviço de Estoque
├── docker-compose.yml                   # Ambiente local completo
├── k8s/base/                            # Manifestos Kubernetes (Deploy, HPA, Secret, etc)
├── terraform/main.tf                    # Esqueleto IaC para VPC e EKS
└── README.md                            # Documentação do projeto
```
