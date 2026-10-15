# PLAN.md

## Goal

Refactor the backend architecture so all database access goes through repositories, business logic lives in services, and controllers stay thin HTTP adapters.

Target dependency direction:

```txt
routes -> controllers -> services -> repositories -> prisma
```

Controllers must not call repositories or Prisma directly.

Services must not import Prisma directly.

Repositories are the only layer allowed to use Prisma, except `src/lib/prisma.ts`.

## Codex Work Rules

Codex must focus only on writing and modifying code.

Do not run checks.

Do not run build commands.

Do not run validation commands.

Do not run tests.

Do not run search commands as verification.

Do not use commands such as:

```bash
pnpm run build
pnpm run test
pnpm run api:validate
pnpm run api:bundle
npm run build
npm test
rg
grep
tsc
eslint
prettier
```

Codex may inspect files that are necessary for editing, but it must not perform verification after changes.

After each phase, Codex should only summarize what files were changed and what code was added or modified.

## Current State

Implemented:

- Basic Express app and route tree.
- Auth flow through `AuthController`, `BotController`, auth service, and user repositories.
- Existing repositories for users, balances, and referrals.
- Prisma models for users, referrals, balances, universes, characters, character presets, chats, messages, attachments, and chat context.

Needs refactor:

- `/api/health` currently queries Prisma directly in `src/routes/index.ts`.
- `UserService` opens a Prisma transaction directly.
- `ChatController` does not implement chat endpoints yet and contains placeholder auth logic.
- Chat repositories and services are missing.
- Controllers contain too much request parsing and auth workflow logic.

## Phase 1: Lock Repository Boundaries

### Task 1.1: Add Transaction Repository

Create:

```txt
src/repositories/transaction.repository.ts
```

Add a `TransactionRepository` with a `run` method that wraps `prisma.$transaction`.

Expected shape:

```ts
import { prisma } from '../lib/prisma'

export class TransactionRepository {
    static async run<T>(
        callback: Parameters<typeof prisma.$transaction>[0],
    ): Promise<T> {
        return prisma.$transaction(callback as never) as Promise<T>
    }
}
```

Adjust the exact typing to match the existing project style.

### Task 1.2: Move UserService Transaction

Update `UserService.createUser`.

Replace direct `prisma.$transaction` usage with `TransactionRepository.run`.

`UserService` must not import Prisma.

### Task 1.3: Add Health Repository

Create:

```txt
src/repositories/health.repository.ts
```

Add:

```ts
export class HealthRepository {
    static async checkDatabase(): Promise<boolean> {
        // SELECT 1 through Prisma
    }
}
```

Use `$queryRaw` inside the repository only.

### Task 1.4: Add Health Service

Create if missing:

```txt
src/services/health.service.ts
```

Add a small service method that calls `HealthRepository.checkDatabase()`.

### Task 1.5: Refactor Health Route

Update `/api/health` in `src/routes/index.ts`.

The route must not import Prisma.

The route should call the health service and return the same public response shape as before.

## Phase 2: Build Chat Repositories

Create repository files for chat domain models.

### UniverseRepository

Create:

```txt
src/repositories/universe.repository.ts
```

Methods:

```ts
findActiveMany()
findActiveById(id: string)
```

### CharacterRepository

Create:

```txt
src/repositories/character.repository.ts
```

Methods:

```ts
findActiveMany(filters)
findActiveById(id: string)
findActiveByIdWithDefaultPreset(id: string)
```

Include active default preset when needed.

### ChatRepository

Create:

```txt
src/repositories/chat.repository.ts
```

Methods:

```ts
create(data, tx?)
findOwnedById(userId: string, chatId: string, tx?)
findOwnedWithMessages(userId: string, chatId: string, tx?)
findManyByUserId(userId: string, filters)
updateOwned(userId: string, chatId: string, data, tx?)
softDeleteOwned(userId: string, chatId: string, tx?)
```

### ChatMessageRepository

Create:

```txt
src/repositories/chatMessage.repository.ts
```

Methods:

```ts
create(data, tx?)
findManyByChatId(chatId: string, pagination, tx?)
getNextIndex(chatId: string, tx?)
```

### Optional Later Repositories

Do not create these unless the current code already needs them:

```txt
ChatAttachmentRepository
ChatContextRepository
```

## Phase 3: Add Chat Services

Create:

```txt
src/services/chat.service.ts
```

Add service methods around use cases, not database tables.

Required methods:

```ts
listUniverses()
listCharacters(filters)
createChat(userId: string, input)
listUserChats(userId: string, filters)
getChat(userId: string, chatId: string)
updateChat(userId: string, chatId: string, input)
deleteChat(userId: string, chatId: string)
```

Service responsibilities:

- validate business input;
- check that character exists and is active;
- check that preset exists and belongs to the selected character;
- choose default preset if no preset is provided;
- check chat ownership;
- create chat snapshots;
- coordinate transactions through `TransactionRepository`;
- map database records into response DTOs;
- throw predictable service errors with HTTP status codes.

Do not put HTTP response logic inside services.

## Phase 4: Replace Chat Controller Placeholder

Update:

```txt
src/controllers/chatController.ts
```

Remove placeholder auth logic.

Add controller methods:

```ts
getUniverses(req, res)
getCharacters(req, res)
createChat(req, res)
getChats(req, res)
getChat(req, res)
updateChat(req, res)
deleteChat(req, res)
```

Controller responsibilities only:

- read `req.user.id`;
- read route params;
- read query filters;
- read request body;
- call one service method;
- return HTTP response;
- convert known service errors into correct status codes.

Controllers must not import:

```ts
prisma
repositories
```

## Phase 5: Wire Chat Routes

Update:

```txt
src/routes/chat.ts
```

Map routes to controller methods.

Expected routes:

```txt
GET    /universes
GET    /characters
POST   /chats
GET    /chats
GET    /chats/:chatId
PATCH  /chats/:chatId
DELETE /chats/:chatId
```

Use the existing auth middleware style from the project.

Do not introduce a new route structure unless required by the current app.

## Phase 6: Normalize Auth Controllers

After chat code is implemented, simplify auth controllers.

Move Telegram request body extraction into a helper or service mapper.

Keep these responsibilities in services:

- user creation;
- referral handling;
- balance initialization;
- user lifecycle logic.

Controllers should only:

- extract request data;
- call service;
- return HTTP response.

## Phase 7: Update OpenAPI Files

Update OpenAPI files for implemented chat endpoints.

Expected endpoints:

```txt
/chat/universes
/chat/characters
/chat/chats
/chat/chats/{chatId}
```

Add or update schemas for:

```txt
Universe
Character
CharacterPreset
Chat
CreateChatRequest
UpdateChatRequest
GetUniversesSuccessResponse
GetCharactersSuccessResponse
CreateChatSuccessResponse
GetChatsSuccessResponse
GetChatSuccessResponse
UpdateChatSuccessResponse
DeleteChatSuccessResponse
```

Do not run OpenAPI validation.

Do not run OpenAPI bundle.

Only edit the YAML files.

## Definition Of Done For Codex

Code should be changed so that:

- routes do not query Prisma directly;
- controllers do not query Prisma directly;
- controllers do not import repositories;
- services do not import Prisma;
- repositories contain database access;
- transaction handling goes through `TransactionRepository`;
- chat repositories exist;
- chat service exists;
- chat controller methods are implemented;
- chat routes are connected;
- OpenAPI files are updated for the implemented endpoints.

Codex must not verify the result with commands.

Codex must finish by listing changed files and briefly explaining what was changed.
