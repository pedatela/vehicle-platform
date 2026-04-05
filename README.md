# Vehicle Platform – Core Service

Serviço administrativo responsável pelo cadastro e manutenção do catálogo de veículos. Ele é o **dono dos dados** e notifica o serviço de vendas via HTTP sempre que um veículo é criado, atualizado ou removido.

## Requisitos

- Node.js 18+
- npm 10+

## Instalação

```bash
npm install
```

## Scripts

- `npm run dev` – executa com `ts-node-dev`.
- `npm run lint` – valida o TypeScript (`tsc --noEmit`).
- `npm test` / `npm run test:coverage` – executa a suíte de testes.
- `npm run build` – compila para `dist/`.
- `npm start` – inicia a versão compilada.

## Estrutura

```
vehicle-platform/
├─ src/
│  ├─ app/
│  │  ├─ http/ (controllers, rotas, middlewares)
│  │  ├─ services/vehicles.service.ts
│  │  └─ services/sales-sync.client.ts
│  ├─ domain/vehicles/ (entidade + contrato do repositório)
│  ├─ infra/repositories/in-memory/ (implementação em memória)
│  └─ server.ts
├─ tests/ (Vitest)
├─ Dockerfile
└─ docker-compose.yml (stack local core + sales + keycloak)
```

## Domínio e sincronização

- **Domain**: entidade `Vehicle` controla atributos básicos (`brand`, `model`, `year`, `color`, `price`, `isSold`, `buyerId`).
- **Application**: `VehiclesService` lida com cadastro, edição, remoção e lista de veículos. Após cada operação ele chama o `SalesSyncClient`, que faz o `POST/PUT/DELETE` nos endpoints internos do serviço de vendas.
- **Infra**: `InMemoryVehiclesRepository` mantém os dados em memória (pode ser trocado por uma implementação Postgres).
- **HTTP**: controllers expõem apenas **APIs administrativas**. O fluxo de compra e listagens públicas acontece no repositório `vehicle-sales-service`.

## Integração com o Sales Service

A comunicação entre os serviços é feita via HTTP:

1. Core cria/atualiza/remove um veículo.
2. `SalesSyncClient` envia a projeção para `POST/PUT/DELETE /api/internal/vehicles` do serviço de vendas.
3. O Sales mantém seu inventário e responde aos clientes (`GET /vehicles/available`, `POST /sales`, webhooks etc.).

Para executar as duas APIs localmente use o `docker-compose.yml` deste diretório:

```bash
docker compose up --build
```

Os containers expõem:

- Core: `http://localhost:3000/api`
- Sales: `http://localhost:4000/api`
- Cognito: use o Hosted UI ou CLI da AWS para autenticar usuários no User Pool configurado

## Infraestrutura (Terraform)

A infraestrutura oficial (VPC, 2 ECR/ECS services, ALB com roteamento, Cognito) vive em `vehicle-infra/terraform`. O pipeline Terraform (`vehicle-infra/.github/workflows/terraform.yml`) roda `plan/apply` e mantém o state em S3.

Este repositório contém apenas o código da API Core e o workflow de entrega contínua (`.github/workflows/deploy.yml`) que:

1. Roda lint + testes.
2. Constrói a imagem Docker.
3. Publica no ECR do serviço administrativo.
4. Força um novo deploy no ECS correspondente.

## Rotas administrativas

| Método | Caminho            | Descrição                                 | Auth |
|--------|-------------------|-------------------------------------------|------|
| GET    | `/api/vehicles`   | Lista veículos (filtro `status=available|sold`). | Público |
| GET    | `/api/vehicles/:id` | Busca veículo específico.               | Público |
| POST   | `/api/vehicles`   | Cria um ou vários veículos.               | JWT + role `seller`. |
| PUT    | `/api/vehicles/:id` | Atualiza o veículo.                     | JWT + role `seller`. |
| DELETE | `/api/vehicles/:id` | Remove o veículo.                       | JWT + role `seller`. |

> A compra e alteração de status público acontecem **exclusivamente** no `vehicle-sales-service`.

### Payloads de exemplo

#### POST /api/vehicles (single)

```json
{
  "brand": "BYD",
  "model": "Seal",
  "year": 2024,
  "color": "Blue",
  "price": 220000,
  "isSold": false
}
```

#### PUT /api/vehicles/:id

```json
{
  "color": "Graphite",
  "price": 215000
}
```

### Payload em lote (POST /api/vehicles)

```json
[
  { "brand": "Tesla", "model": "Model 3", "year": 2024, "color": "Azul", "price": 289000, "isSold": false },
  { "brand": "Ford", "model": "Mustang Mach-E", "year": 2023, "color": "Vermelho", "price": 315000, "isSold": false },
  { "brand": "Chevrolet", "model": "Bolt EUV", "year": 2022, "color": "Branco", "price": 198000, "isSold": false },
  { "brand": "Volkswagen", "model": "ID.4", "year": 2024, "color": "Preto", "price": 255000, "isSold": false },
  { "brand": "BMW", "model": "i4 eDrive40", "year": 2023, "color": "Cinza", "price": 379000, "isSold": false },
  { "brand": "Audi", "model": "Q4 e-tron", "year": 2024, "color": "Azul Marinho", "price": 365000, "isSold": false },
  { "brand": "Volvo", "model": "C40 Recharge", "year": 2023, "color": "Branco Gelo", "price": 342000, "isSold": false },
  { "brand": "Hyundai", "model": "Ioniq 5", "year": 2024, "color": "Prata", "price": 268000, "isSold": false },
  { "brand": "Kia", "model": "EV6 GT-Line", "year": 2023, "color": "Verde Escuro", "price": 295000, "isSold": false },
  { "brand": "Porsche", "model": "Taycan 4S", "year": 2024, "color": "Preto Carbon", "price": 695000, "isSold": false }
]
```

## Autenticação (AWS Cognito)

O middleware `authenticate` valida tokens emitidos por um User Pool do Amazon Cognito. Configure o issuer e o audience via variáveis.

### Variáveis de ambiente

```env
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_abc123DEF
COGNITO_CLIENT_ID=4h1exampleappclient
AUTH_SELLER_ROLE=seller
SALES_SERVICE_URL=http://sales:4000/api
SALES_SERVICE_TOKEN=local-sync-token
# Opcional: definir explicitamente o issuer
# COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123DEF
```

- `SALES_SERVICE_URL` aponta para o prefixo público do serviço de vendas (em produção usamos o mesmo ALB com path `/sales`).
- `SALES_SERVICE_TOKEN` deve coincidir com `INTERNAL_SYNC_TOKEN` configurado no `vehicle-sales-service`.

## Deploy na AWS (CI/CD + ECS)

O workflow `.github/workflows/deploy.yml` espera as seguintes variáveis/segredos no repositório:

| Tipo     | Nome                 | Descrição                                                                 |
|----------|----------------------|----------------------------------------------------------------------------|
| Secret   | `AWS_ACCESS_KEY_ID`  | Access key com permissão para ECR/ECS (mesma conta usada pelo Terraform). |
| Secret   | `AWS_SECRET_ACCESS_KEY` | Secret correspondente.                                                |
| Secret   | `AWS_ACCOUNT_ID`     | ID da conta AWS (usado para montar a URL do ECR).                         |
| Variable | `ECR_REPOSITORY`     | Nome do repositório ECR do Core (ex.: `postech-app-core`).                |
| Variable | `ECS_CLUSTER_NAME`   | Nome do cluster ECS (ex.: `postech-app-cluster`).                         |
| Variable | `ECS_SERVICE_NAME`   | Serviço ECS do Core (ex.: `postech-app-core-svc`).                        |
| Variable | `AWS_REGION` (opcional) | Região usada pelo workflow (padrão `us-east-1`).                    |

Antes de rodar a pipeline em `main`, verifique se:

1. O Terraform do repositório `vehicle-infra` já criou o ECR, cluster e serviço ECS.
2. Os segredos/variáveis acima estão preenchidos no GitHub.
3. A imagem já foi gerada ao menos uma vez (o workflow cria o repositório se não existir).

## Testes

```bash
npm test
```

Os testes cobrem filtros da lista, criação em lote e o mecanismo de notificação para o Sales Service (incluindo tratamento de falhas na sincronização).
