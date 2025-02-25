-- AlterTable
ALTER TABLE "task" ADD COLUMN     "project_id" UUID;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;
