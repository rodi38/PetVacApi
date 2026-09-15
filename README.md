# PetVacApi

API REST para o aplicativo móvel PetVac, responsável pelo cadastro de pets e pelo controle de suas vacinações. Construída com Fastify, TypeScript e MongoDB (driver nativo, sem ORM).

## Sumário

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Configuração e variáveis de ambiente](#configuração-e-variáveis-de-ambiente)
- [Como rodar](#como-rodar)
- [Autenticação](#autenticação)
- [Formato das respostas](#formato-das-respostas)
- [Endpoints](#endpoints)
- [Modelos de dados](#modelos-de-dados)
- [Regras de negócio importantes](#regras-de-negócio-importantes)
- [Testes](#testes)
- [Limitações conhecidas](#limitações-conhecidas)

## Stack

- **Fastify 5** — servidor HTTP
- **TypeScript**
- **MongoDB** (driver nativo `mongodb`, sem ORM/ODM) — persistência
- **Zod** — validação de entrada (body) e derivação dos schemas do Swagger via `zod-to-json-schema`
- **JWT** (`jsonwebtoken`) — autenticação
- **bcrypt** — hash de senhas
- **@fastify/helmet**, **@fastify/rate-limit** — segurança
- **@fastify/swagger** + **@fastify/swagger-ui** — documentação OpenAPI, servida em `/docs`
- **pino** — logging
- **Jest** + **mongodb-memory-server** — testes

## Arquitetura

```
src/
  app.ts                     # bootstrap do Fastify, plugins, rotas, start/shutdown
  config/
    env.ts                   # leitura/validação de variáveis de ambiente
    mongo.ts                 # conexão Mongo, getDb(), withTransaction()
    ensureIndexes.ts         # criação de índices no boot
    logger.ts                # logger pino compartilhado (fora do ciclo de request)
  routes/                    # definição de rotas Fastify + schemas de Swagger
  controllers/                # parsing/validação de request, orquestração, resposta HTTP
  services/                   # regras de negócio e acesso ao MongoDB
  models/
    entities/                # shape dos documentos MongoDB
    schemas/                 # schemas Zod de validação de entrada
  middleware/
    authMiddleware.ts        # verificação de JWT (preHandler `authenticate`)
    errorMiddleware.ts       # error handler e 404 handler globais
  utils/
    errorHandler.ts          # AppError, sendSuccess, handleError (envelope de resposta)
    swaggerSchemas.ts        # helpers para gerar schemas OpenAPI a partir de Zod
  types/fastify.d.ts         # augmentation de FastifyRequest (authenticatedUser)
test/                        # testes de integração (Jest + mongodb-memory-server)
```

Fluxo típico de uma requisição: `route` (Fastify, schema de Swagger + `preHandler: authenticate` quando exigido) → `controller` (parse com Zod, chamadas de serviço, monta resposta) → `service` (regra de negócio, acesso ao MongoDB) → resposta padronizada via `sendSuccess`/`AppError`.

## Configuração e variáveis de ambiente

Definidas em `src/config/env.ts`, carregadas via `dotenv`. Um arquivo `.env.example` está disponível como referência.

| Variável         | Obrigatória | Padrão    | Descrição                                            |
| ---------------- | :---------: | --------- | ----------------------------------------------------- |
| `MONGO_URI`      |     Sim     | —         | Connection string do MongoDB                          |
| `MONGO_DATABASE` |     Sim     | —         | Nome do banco de dados                                 |
| `JWT_SECRET`     |     Sim     | —         | Segredo usado para assinar/verificar os JWTs           |
| `MONGO_ADMIN`    |     Não     | `admin`   | `authSource` usado na conexão com o MongoDB            |
| `JWT_EXPIRES_IN` |     Não     | `1h`      | Tempo de expiração dos tokens JWT                      |
| `PORT`           |     Não     | `5000`    | Porta em que o servidor escuta (bind em `0.0.0.0`)     |
| `LOG_LEVEL`      |     Não     | `info`    | Nível de log do pino (`logger.ts`)                     |

Se `MONGO_URI`, `MONGO_DATABASE` ou `JWT_SECRET` não estiverem definidas, a aplicação lança erro na inicialização.

## Como rodar

```bash
npm install
cp .env.example .env   # preencher com valores reais
npm run dev             # desenvolvimento (nodemon, roda src/app.ts direto)
```

Build e execução em produção:

```bash
npm run build   # gera build/app.js (tsup, formato cjs)
npm start        # node build/app.js
```

Testes:

```bash
npm test
```

Com o servidor rodando, a documentação interativa (Swagger UI) fica disponível em `http://localhost:<PORT>/docs`.

Todas as rotas de negócio ficam sob o prefixo `/api/v1`.

## Autenticação

Autenticação via JWT Bearer token (`authMiddleware.ts`):

1. Login (`POST /api/v1/auth/login`) retorna um `token`.
2. Requisições a rotas protegidas devem enviar `Authorization: Bearer <token>`.
3. O middleware `authenticate` verifica a assinatura do token, busca o usuário no banco e anexa `request.authenticatedUser = { userId }` para uso nos controllers/services.
4. Ao trocar a senha, o campo `passwordChangedAt` do usuário é atualizado; qualquer token emitido **antes** dessa data passa a ser rejeitado (invalidação de sessões antigas). Não há endpoint de refresh token nem de logout — logout é responsabilidade do cliente (descartar o token).

Todas as rotas de `pets` e `vaccines` exigem autenticação. Em `auth`, apenas `PUT /users/:userId` exige autenticação.

## Formato das respostas

Todas as respostas seguem o mesmo envelope, definido em `src/utils/errorHandler.ts`:

Sucesso:

```json
{ "success": true, "data": { ... }, "error": null }
```

Erro:

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Descrição do erro",
    "code": "OPTIONAL_ERROR_CODE",
    "details": [{ "field": "campo", "message": "motivo" }]
  }
}
```

- Erros de validação Zod e de schema de rota (Ajv, params/query) retornam `400` com `details` por campo.
- Erros de domínio (`AppError`) retornam o `statusCode` definido (400/401/403/404) e um `code` (ex: `PET_NOT_FOUND`, `USER_EXISTS`, `INVALID_CREDENTIALS`, `FORBIDDEN`, `VACCINE_NOT_FOUND`, `VACCINATION_NOT_FOUND`, `VACCINE_ALREADY_REGISTERED`, `EMAIL_IN_USE`, `INVALID_PASSWORD`).
- Erros inesperados retornam `500` com mensagem genérica (detalhes internos nunca são expostos ao cliente).
- Rotas inexistentes retornam `404` com `"Rota não encontrada"`.

## Endpoints

### Health

| Método | Rota                    | Auth | Descrição                                  |
| ------ | ----------------------- | :--: | ------------------------------------------- |
| GET    | `/api/v1/healthcheck`   | Não  | Verifica conexão com o MongoDB (`200`/`503`) |

### Auth (`/api/v1/auth`)

| Método | Rota                | Auth | Descrição                                              |
| ------ | ------------------- | :--: | -------------------------------------------------------- |
| POST   | `/register`         | Não  | Cria um novo usuário. Rate limit dedicado: 5 req/min      |
| POST   | `/login`            | Não  | Autentica e retorna `{ user, token }`. Rate limit: 5/min  |
| PUT    | `/users/:userId`    | Sim  | Atualiza dados/senha do próprio usuário (403 se `userId` diferente do usuário autenticado) |

### Pets (`/api/v1/pets`) — todas as rotas exigem autenticação

| Método | Rota                                        | Descrição                                                        |
| ------ | ------------------------------------------- | ----------------------------------------------------------------- |
| POST   | `/`                                         | Cria um pet (dono = usuário autenticado, ignorando `owner` do body) |
| GET    | `/`                                         | Lista pets do usuário autenticado (paginado)                       |
| GET    | `/owner/:ownerId`                           | Lista pets de um dono (só o próprio `ownerId`, senão `403`)         |
| GET    | `/:id`                                      | Detalhe de um pet (404 se não existir ou não pertencer ao usuário)  |
| PUT    | `/:id`                                      | Atualização parcial de um pet                                      |
| DELETE | `/:id`                                      | Soft-delete do pet e de suas vacinações (204)                       |
| GET    | `/:petId/vaccinations`                      | Lista vacinações aplicadas no pet (paginado)                        |
| GET    | `/:petId/vaccinations/count`                | Contagem de vacinações do pet                                       |
| POST   | `/:petId/vaccinations`                      | Registra a aplicação de uma vacina no pet                           |
| GET    | `/:petId/vaccinations/:vaccineId`           | Detalhe de uma vacinação (vacina + doses)                           |
| PUT    | `/:petId/vaccinations/:vaccineId`           | Atualização parcial de uma vacinação                                |
| DELETE | `/:petId/vaccinations/:vaccineId`           | Soft-delete de uma vacinação (204)                                  |

### Vaccines (`/api/v1/vaccines`) — catálogo de tipos de vacina, todas as rotas exigem autenticação

| Método | Rota    | Descrição                                                              |
| ------ | ------- | ------------------------------------------------------------------------ |
| POST   | `/`     | Cria um tipo de vacina                                                     |
| GET    | `/`     | Lista tipos de vacina (paginado)                                           |
| GET    | `/:id`  | Detalhe de um tipo de vacina                                               |
| PUT    | `/:id`  | Atualização parcial de um tipo de vacina                                   |
| DELETE | `/:id`  | Soft-delete do tipo de vacina, com cascata de soft-delete nas vacinações que o referenciam |

Paginação: rotas de listagem aceitam `?page` (default `1`) e `?limit` (default `20`, máx `100`) e retornam `{ items, page, limit, total, totalPages }` dentro de `data`.

## Modelos de dados

### User (`users`)

| Campo               | Tipo     | Observação                              |
| ------------------- | -------- | ----------------------------------------- |
| `_id`                | ObjectId |                                            |
| `username`           | string   | 3-50 chars, `^[a-zA-Z0-9_]+$`             |
| `email`              | string   | único (índice), lowercase                 |
| `password`           | string   | hash bcrypt — nunca retornado ao cliente  |
| `passwordChangedAt`  | Date?    | usado para invalidar JWTs antigos         |
| `createdAt`/`updatedAt` | Date  |                                            |

### Pet (`pets`)

| Campo        | Tipo     | Observação                                   |
| ------------ | -------- | ----------------------------------------------- |
| `_id`         | ObjectId |                                                  |
| `name`        | string   | 1-50 chars                                       |
| `petType`     | string   | 1-50 chars                                       |
| `breed`       | string   | 1-50 chars                                       |
| `gender`      | enum     | `male` \| `female` \| `other`                   |
| `birthDate`   | Date     | não pode ser futura nem > 50 anos atrás          |
| `owner`       | ObjectId | dono do pet (sempre do JWT, nunca do body)       |
| `createdAt`/`updatedAt` | Date |                                             |
| `deletedAt`   | Date? \| null | soft-delete                                |

`age` e `ageDetail` **não são armazenados** — são calculados a partir de `birthDate` em tempo de leitura (controller `petController.ts`). Para pets com menos de 1 ano, `ageDetail` traz `{ unit: "weeks" | "months", value }`.

### Vaccine (`vaccines`) — catálogo de tipos de vacina

| Campo         | Tipo     | Observação      |
| ------------- | -------- | ---------------- |
| `_id`          | ObjectId |                  |
| `name`         | string   | 1-50 chars       |
| `description`  | string?  | máx 500 chars    |
| `createdAt`/`updatedAt` | Date |             |
| `deletedAt`    | Date? \| null | soft-delete |

### PetVaccine (`pet_vaccines`) — vacinação aplicada em um pet

| Campo          | Tipo       | Observação                                    |
| -------------- | ---------- | ------------------------------------------------ |
| `_id`           | ObjectId   |                                                    |
| `petId`         | ObjectId   |                                                    |
| `vaccineId`     | ObjectId   |                                                    |
| `doses`         | Date[]     | mín. 1 dose, sem datas duplicadas, ordenadas cronologicamente |
| `notes`         | string?    | máx 1000 chars                                    |
| `veterinarian`  | string?    | 4-100 chars                                        |
| `clinic`        | string?    | 3-100 chars                                        |
| `createdAt`/`updatedAt` | Date |                                                  |
| `deletedAt`     | Date? \| null | soft-delete                                    |

## Regras de negócio importantes

- **Soft delete em tudo (exceto usuários)**: pets, vacinas e vacinações usam `deletedAt` em vez de exclusão física, preservando o histórico de saúde do animal. Usuários nunca são excluídos.
- **Cascata de exclusão**: excluir um pet também marca suas vacinações como excluídas (transação). Excluir um tipo de vacina do catálogo marca como excluídas todas as vacinações que o referenciam.
- **Transações MongoDB**: `withTransaction` (`src/config/mongo.ts`) usa sessão/transação real quando o servidor suporta (replica set, como no MongoDB Atlas). Em ambientes sem replica set (ex.: testes locais com `mongodb-memory-server` standalone), cai para execução sequencial sem atomicidade.
- **Proteção contra IDOR**: acessar um recurso (pet, vacinação) que existe mas não pertence ao usuário autenticado retorna `404` (não `403`), para não revelar a existência do recurso a terceiros.
- **`owner` sempre vem do JWT**: ao criar um pet, qualquer campo `owner` enviado no body é ignorado — o dono é sempre o usuário autenticado.
- **Senhas**: exigem mínimo 8 caracteres com minúscula, maiúscula, dígito e símbolo. Trocar a senha exige `currentPassword` correta e invalida tokens emitidos anteriormente.
- **Vacinação duplicada**: não é possível registrar a mesma vacina duas vezes (ativa) para o mesmo pet.

## Testes

Testes de integração com Jest + `mongodb-memory-server` (banco em memória, sem replica set — transações reais não são exercitadas fim-a-fim nos testes). Arquivos em `test/`:

| Arquivo                  | Cobertura                                                              |
| ------------------------ | -------------------------------------------------------------------------- |
| `auth.test.ts`           | Registro, login, validação de senha, proteção de rotas, invalidação de token após troca de senha |
| `ownership.test.ts`      | Proteção contra IDOR (pets/vacinações de outros usuários, spoof de `owner`) |
| `pagination.test.ts`     | Paginação de listagens (defaults e limites)                                |
| `pets.test.ts`           | Cálculo de idade/`ageDetail` a partir de `birthDate`                        |
| `softDelete.test.ts`     | Soft-delete preserva os documentos no banco (`deletedAt`)                    |
| `vaccinations.test.ts`   | Ciclo completo de registro/consulta/atualização/remoção de vacinações, múltiplas doses |

Executar com `npm test`.

## Update futuros

- Refresh token
- Usuario poderia cadastrar as vacinas de reforços em diferentes clinicas e veterinários
- Relatórios
