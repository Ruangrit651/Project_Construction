-- AlterTable
ALTER TABLE "user" ADD COLUMN     "project_id" UUID;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("project_id") ON DELETE SET NULL ON UPDATE CASCADE;
