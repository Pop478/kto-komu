-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "UserTheme" AS ENUM ('light', 'dark', 'system');

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "username" VARCHAR(255),
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "languageCode" VARCHAR(10),
    "photo_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "theme" "UserTheme" NOT NULL DEFAULT 'dark',
    "ban" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "registeredFromBotId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_username_idx" ON "account"("username");
