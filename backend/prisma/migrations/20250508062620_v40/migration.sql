-- CreateTable
CREATE TABLE "relation" (
    "relation_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relation_pkey" PRIMARY KEY ("relation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "relation_project_id_user_id_key" ON "relation"("project_id", "user_id");

-- AddForeignKey
ALTER TABLE "relation" ADD CONSTRAINT "relation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relation" ADD CONSTRAINT "relation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
