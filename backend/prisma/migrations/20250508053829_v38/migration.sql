/*
  Warnings:

  - You are about to drop the column `project_id` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_project_id_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "project_id";
