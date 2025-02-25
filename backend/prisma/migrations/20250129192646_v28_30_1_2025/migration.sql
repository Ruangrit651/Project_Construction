-- AlterTable
ALTER TABLE "resource" ADD COLUMN     "task_id" UUID;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;
