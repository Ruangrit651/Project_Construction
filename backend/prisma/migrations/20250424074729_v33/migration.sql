-- AlterTable
ALTER TABLE "resource" ADD COLUMN     "subtask_id" UUID;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_subtask_id_fkey" FOREIGN KEY ("subtask_id") REFERENCES "subtask"("subtask_id") ON DELETE SET NULL ON UPDATE CASCADE;
