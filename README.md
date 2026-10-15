# TG Template

Универсальный шаблон для разработки:

- Telegram Bot (grammY)
- Telegram Mini App (React + Vite)
- Backend (Node.js + TypeScript + Prisma)
- OpenAPI + Swagger
- Production-ready архитектура

Подходит для:

- bot-only
- mini-app-only
- hybrid (bot + mini app + backend)

---

# 📦 Стек

### Backend

- Node.js 22+
- TypeScript (strict)
- Prisma + PostgreSQL
- OpenAPI (Swagger)
- Redocly
- Zod
- grammY
- Webhook-ready

### Frontend (Mini App)

- React 18+
- Vite
- Zustand
- Telegram Mini Apps SDK
- TON Connect ready

---

# 🚀 Быстрый старт

# 🖥 Frontend (Mini App)

Перейти в папку фронтенда:

```
cd Frontend
```

Установка зависимостей:

```
pnpm install
```

Запуск dev-сервера:

```
pnpm run dev
```

После запуска Mini App доступен на локальном Vite-сервере.

---

# 🛠 Backend

Перейти в папку backend:

```
cd Backend
```

Установка зависимостей:

```
pnpm install
```

Запуск в dev-режиме:

```
pnpm run dev
```

---

# 🗄 Работа с базой данных (Prisma)

Перед запуском убедитесь, что настроен `.env` и указана:

```
DATABASE_URL=
```

### Создание и применение миграций:

```
pnpm prisma:migrate
```

---

### Генерация Prisma Client:

```
pnpm prisma:generate
```

---

# 📘 Swagger / OpenAPI

OpenAPI схема хранится в:

```
src/api/openapi.yaml
```

---

## Сборка (bundle) схемы:

```
pnpm api:bundle
```

---

## Генерация TypeScript API клиента для Frontend:

```
pnpm api:generate
```

После генерации API автоматически появится в:

```
Frontend/src/api
```
