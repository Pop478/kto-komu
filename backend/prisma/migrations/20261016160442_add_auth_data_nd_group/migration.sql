/*
  Warnings:

  - The primary key for the `account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ban` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `languageCode` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `registeredFromBotId` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `termsAccepted` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `account` table. All the data in the column will be lost.
  - You are about to alter the column `username` on the `account` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(32)`.
  - You are about to alter the column `first_name` on the `account` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to alter the column `last_name` on the `account` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - The `theme` column on the `account` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The required column `account_id` was added to the `account` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updated_at` to the `account` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('guest', 'registered');

-- CreateEnum
CREATE TYPE "user_theme" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "group_role" AS ENUM ('owner', 'admin', 'member');

-- DropIndex
DROP INDEX "account_username_idx";

-- AlterTable
ALTER TABLE "account" DROP CONSTRAINT "account_pkey",
DROP COLUMN "ban",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "languageCode",
DROP COLUMN "registeredFromBotId",
DROP COLUMN "role",
DROP COLUMN "termsAccepted",
DROP COLUMN "updatedAt",
ADD COLUMN     "account_id" UUID NOT NULL,
ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" VARCHAR(254),
ADD COLUMN     "email_verified_at" TIMESTAMPTZ(3),
ADD COLUMN     "gender" "gender",
ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language_code" VARCHAR(35),
ADD COLUMN     "status" "account_status" NOT NULL DEFAULT 'guest',
ADD COLUMN     "terms_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "terms_accepted_at" TIMESTAMPTZ(3),
ADD COLUMN     "terms_version" VARCHAR(32),
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL,
ALTER COLUMN "username" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "first_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "last_name" SET DATA TYPE VARCHAR(100),
DROP COLUMN "theme",
ADD COLUMN     "theme" "user_theme" NOT NULL DEFAULT 'system',
ADD CONSTRAINT "account_pkey" PRIMARY KEY ("account_id");

-- DropEnum
DROP TYPE "UserRole";

-- DropEnum
DROP TYPE "UserTheme";

-- CreateTable
CREATE TABLE "oauth_identity" (
    "identity_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "provider_user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_identity_pkey" PRIMARY KEY ("identity_id")
);

-- CreateTable
CREATE TABLE "password_credential" (
    "account_id" UUID NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "password_updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_credential_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "group" (
    "group_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "group_member" (
    "member_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "account_id" UUID,
    "display_name" VARCHAR(100) NOT NULL,
    "role" "group_role" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("member_id")
);

-- CreateIndex
CREATE INDEX "oauth_identity_account_id_idx" ON "oauth_identity"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_identity_provider_provider_user_id_key" ON "oauth_identity"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "group_member_account_id_idx" ON "group_member"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_member_group_id_account_id_key" ON "group_member"("group_id", "account_id");

-- CreateIndex
CREATE INDEX "account_status_created_at_idx" ON "account"("status", "created_at");

-- AddForeignKey
ALTER TABLE "oauth_identity" ADD CONSTRAINT "oauth_identity_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_credential" ADD CONSTRAINT "password_credential_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;
