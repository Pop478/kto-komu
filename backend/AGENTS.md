# AGENTS.md

## Project Context

This backend is a TypeScript Express API using Prisma 7 with generated client code in `src/generated/prisma`.

Main layers:

- `src/routes`: Express route registration and middleware composition.
- `src/controllers`: HTTP adapter layer.
- `src/service`: application and domain use cases.
- `src/repositories`: all database access.
- `src/lib`: shared infrastructure such as Prisma, logger, Swagger.
- `prisma/models`: split Prisma schema models.

The target architecture is:

```txt
routes -> controllers -> services -> repositories -> prisma
```

## Main Codex Rule

Codex must write and modify code only.

Codex must not run project checks.

Codex must not run tests.

Codex must not run builds.

Codex must not run validation commands.

Codex must not run formatting commands.

Codex must not run search commands for verification.

Do not run commands such as:

```bash
pnpm run build
pnpm run dev
pnpm run test
pnpm run api:validate
pnpm run api:bundle
pnpm run prisma:generate
pnpm run prisma:migrate
npm run build
npm test
tsc
eslint
prettier
rg
grep
```

Codex may inspect files that are necessary to edit the code, but after editing it must not verify the result by running commands.

At the end of the task, Codex should only provide:

- list of changed files;
- short explanation of what was changed;
- mention that checks were not run because the instruction says not to run them.

## Architecture Rule

All database queries must go through repositories.

Controllers must not import Prisma, repositories, or domain persistence models directly.

Services must not import Prisma directly.

Only repositories and `src/lib/prisma.ts` may use Prisma directly.

Controllers are HTTP adapters only.

Business rules belong in services.

Database queries belong in repositories.

## Layer Responsibilities

### Routes

Routes are responsible only for:

- registering paths;
- registering HTTP methods;
- composing middleware;
- connecting route handlers to controller methods.

Routes must not:

- contain business logic;
- query the database;
- import Prisma;
- import repositories;
- create service workflows inline.

Prefer controller instance methods bound safely if the method uses `this`.

Example:

```ts
router.get(
    '/chats',
    authMiddleware,
    chatController.getChats.bind(chatController),
)
```

If controller methods are static or arrow functions, use the existing project style.

### Controllers

Controllers are responsible only for:

- reading `req.body`;
- reading `req.query`;
- reading `req.params`;
- reading `req.headers`;
- reading `req.cookies`;
- reading `req.user`;
- normalizing primitive request values;
- calling one service method per endpoint;
- returning HTTP status codes and JSON responses;
- mapping known service errors to HTTP responses.

Allowed in controllers:

```ts
const userId = req.user?.id
const chatId = String(req.params.chatId)
const limit = Number(req.query.limit ?? 50)
```

Not allowed in controllers:

```ts
import { prisma } from '../lib/prisma.js'
import { ChatRepository } from '../repositories/chat.repository.js'

prisma.chat.findMany(...)
repository.findOwnedById(...)
prisma.$transaction(...)
prisma.$queryRaw(...)
```

Controllers must not contain:

- ownership checks using database queries;
- balance calculations;
- user lifecycle logic;
- referral logic;
- chat history construction;
- related-record creation workflows.

### Services

Services are responsible for application use cases.

Services may:

- import repositories;
- validate business input;
- enforce ownership;
- enforce permissions;
- coordinate multi-step workflows;
- create snapshots;
- select default records;
- map repository records into DTOs;
- throw typed application errors with status codes.

Services must not:

- import Prisma directly;
- call `prisma.$transaction` directly;
- know about Express `Request` or `Response`;
- return raw HTTP responses.

If a transaction is needed, use repository infrastructure:

```ts
TransactionRepository.run(async (tx) => {
    // repository calls with tx
})
```

### Repositories

Repositories are the only application layer allowed to perform Prisma queries.

Repositories may:

- import `prisma` from `src/lib/prisma`;
- import Prisma generated types;
- execute Prisma queries;
- accept optional `Prisma.TransactionClient`;
- return database records or persistence DTOs.

Repositories must not:

- import Express types;
- read HTTP requests;
- write HTTP responses;
- know about cookies, headers, or status codes;
- contain controller logic.

## Repository Pattern

Use this shape for new repositories:

```ts
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'

type TxClient = Prisma.TransactionClient

export class ExampleRepository {
    private static db(tx?: TxClient) {
        return tx ?? prisma
    }

    static async findById(id: string, tx?: TxClient) {
        return this.db(tx).example.findUnique({
            where: { id },
        })
    }
}
```

Use optional transaction clients for repository methods that may participate in larger workflows:

```ts
static async create(data: Prisma.ExampleCreateInput, tx?: TxClient) {
    return this.db(tx).example.create({
        data,
    })
}
```

## Transaction Repository

Keep transaction access centralized.

Create or use:

```ts
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'

export class TransactionRepository {
    static run<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
        return prisma.$transaction(callback)
    }
}
```

Services should use this instead of importing Prisma.

Correct:

```ts
return TransactionRepository.run(async (tx) => {
    const user = await UserRepository.create(data, tx)
    await BalanceRepository.createForUser(user.id, tx)

    return user
})
```

Incorrect:

```ts
return prisma.$transaction(async (tx) => {
    // service-level Prisma transaction
})
```

## Error Handling

Prefer typed service errors for expected domain failures.

Recommended shape:

```ts
export class ServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode = 500,
    ) {
        super(message)
    }
}
```

Use status codes consistently:

- `400`: invalid request data.
- `401`: missing or invalid authentication.
- `403`: authenticated user has no access.
- `404`: resource not found.
- `409`: state conflict.
- `500`: unexpected server error.

Controllers may catch known service errors and map them to JSON.

Example:

```ts
try {
    const result = await ChatService.getChat(userId, chatId)

    return res.status(200).json({
        ok: true,
        chat: result,
    })
} catch (error) {
    if (error instanceof ChatServiceError) {
        return res.status(error.statusCode).json({
            ok: false,
            error: error.message,
        })
    }

    return res.status(500).json({
        ok: false,
        error: 'Internal server error',
    })
}
```

## Chat API Target Shape

Routes in `src/routes/chat.ts` should map to dedicated controller methods:

```txt
GET    /universes       -> list active universes
GET    /characters      -> list active characters
POST   /chats           -> create chat for authenticated user
GET    /chats           -> list authenticated user's chats
GET    /chats/:chatId   -> get one chat with messages after ownership check
PATCH  /chats/:chatId   -> update chat title or settings after ownership check
DELETE /chats/:chatId   -> soft-delete chat after ownership check
```

Controllers should call:

```txt
UniverseService
CharacterService
ChatService
```

Services should call repositories.

Repositories should call Prisma.

## Chat Controller Requirements

`src/controllers/chatController.ts` must contain real chat handlers, not auth placeholder logic.

Required methods:

```ts
getUniverses(req, res)
getCharacters(req, res)
createChat(req, res)
getChats(req, res)
getChat(req, res)
updateChat(req, res)
deleteChat(req, res)
```

Controller responsibilities:

- read authenticated user id from `req.user`;
- read params such as `chatId`;
- read query filters such as `universeId`, `limit`, `offset`;
- read body fields such as `characterId`, `characterPresetId`, `scenarioId`, `title`, `historyMode`;
- call one service method;
- return JSON response.

The controller must not:

- import Prisma;
- import repositories;
- create users;
- parse Telegram auth payloads;
- contain auth workflow logic.

## Chat Service Requirements

`ChatService` should expose use-case methods:

```ts
createChat(userId: string, input)
listUserChats(userId: string, filters)
getChat(userId: string, chatId: string)
updateChat(userId: string, chatId: string, input)
deleteChat(userId: string, chatId: string)
```

Service responsibilities:

- validate required input;
- check that the character exists and is active;
- check that the preset exists and belongs to the character;
- choose default preset if no preset is provided;
- check chat ownership;
- create character snapshots for chat records;
- coordinate transactions through `TransactionRepository`;
- map database records to response DTOs.

## Chat Repository Requirements

Create or update repositories for chat domain.

Recommended files:

```txt
src/repositories/universe.repository.ts
src/repositories/character.repository.ts
src/repositories/characterPreset.repository.ts
src/repositories/chat.repository.ts
src/repositories/chatMessage.repository.ts
```

### UniverseRepository

Required methods:

```ts
findActiveMany()
findActiveById(id: string)
```

### CharacterRepository

Required methods:

```ts
findActiveMany(filters)
findActiveById(id: string)
findActiveByIdWithDefaultPreset(id: string)
```

Required methods:

```ts
findActiveById(id: string)
findDefaultByCharacterId(characterId: string)
```

### ChatRepository

Required methods:

```ts
create(data, tx?)
findOwnedById(userId: string, chatId: string, tx?)
findOwnedWithMessages(userId: string, chatId: string, tx?)
findManyByUserId(userId: string, filters)
updateOwned(userId: string, chatId: string, data, tx?)
softDeleteOwned(userId: string, chatId: string, tx?)
```

### ChatMessageRepository

Required methods:

```ts
create(data, tx?)
findManyByChatId(chatId: string, pagination, tx?)
getNextIndex(chatId: string, tx?)
```

## Health Route Refactor

`src/routes/index.ts` must not import Prisma for `/health`.

Move database health check to repository layer.

Recommended structure:

```txt
src/repositories/health.repository.ts
src/service/health/health.service.ts
```

Repository:

```ts
import { prisma } from '../lib/prisma.js'

export class HealthRepository {
    static async checkDatabase() {
        await prisma.$queryRaw`SELECT 1`

        return true
    }
}
```

Service:

```ts
import { HealthRepository } from '../../repositories/health.repository.js'

export class HealthService {
    static async check() {
        return HealthRepository.checkDatabase()
    }
}
```

Route should call service, not Prisma.

## Auth Refactor Rule

Auth controllers should stay thin.

Move these workflows into services or helpers:

- Telegram body extraction;
- Telegram user normalization;
- user creation;
- referral handling;
- balance initialization;
- token/cookie workflow if already abstracted in the project.

Do not put user lifecycle logic in controllers.

## OpenAPI Rule

When endpoint behavior changes, update OpenAPI YAML files.

Expected chat paths:

```txt
/chat/universes
/chat/characters
/chat/chats
/chat/chats/{chatId}
```

Update schemas and responses as needed.

Do not run:

```bash
pnpm run api:validate
pnpm run api:bundle
```

Only edit the YAML files.

## ESM Import Rule

Use ESM imports with `.js` extensions for local TypeScript modules.

Correct:

```ts
import { ChatService } from '../service/chat/chat.service.js'
```

Incorrect:

```ts
import { ChatService } from '../service/chat/chat.service'
```

Do not edit generated files in:

```txt
src/generated/prisma
```

## Code Style

Follow the existing project style.

Prefer:

- TypeScript strict-friendly code;
- explicit service input types;
- small DTO mappers;
- narrow repository methods;
- consistent response shapes;
- no unrelated formatting churn.

Do not introduce new libraries unless the task explicitly requires it.

Do not rename folders unless required by existing imports or project structure.

## Current Known Issues

Address these when relevant to the task:

- `src/routes/index.ts` imports Prisma for `/health`.
- `src/service/user/user.service.ts` imports Prisma only for `$transaction`.
- `src/controllers/chatController.ts` is a placeholder and contains auth-style code.
- `src/controllers/chatController.ts` references `getTelegramUserFromBody`, but that helper is not defined in the file.
- Chat route comments may contain broken encoding; do not rely on comments as source of truth.

## Final Response Format For Codex

After making code changes, respond in this format:

```txt
Changed files:
- path/to/file.ts — what changed
- path/to/another-file.ts — what changed

Notes:
- Checks were not run because the instruction says not to run checks.
```

Do not claim that build, tests, validation, or type checking passed unless they were explicitly run by the user outside Codex.
