/*
  Warnings:

  - You are about to drop the `plan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "plan" DROP CONSTRAINT "plan_created_by_fkey";

-- DropForeignKey
ALTER TABLE "plan" DROP CONSTRAINT "plan_updated_by_fkey";

-- DropTable
DROP TABLE "plan";

-- CreateTable
CREATE TABLE "Progress" (
    "progress_id" UUID NOT NULL,
    "task_id" UUID,
    "subtask_id" UUID,
    "percent" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "date_recorded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3),
    "updated_by" UUID,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("progress_id")
);

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_subtask_id_fkey" FOREIGN KEY ("subtask_id") REFERENCES "subtask"("subtask_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
