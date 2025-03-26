-- CreateTable
CREATE TABLE "subtask" (
    "subtask_id" UUID NOT NULL,
    "task_id" UUID,
    "subtask_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "budget" DECIMAL(15,2) NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3),
    "updated_by" UUID,

    CONSTRAINT "subtask_pkey" PRIMARY KEY ("subtask_id")
);

-- CreateTable
CREATE TABLE "task_dependency" (
    "dependency_id" UUID NOT NULL,
    "task_id" UUID,
    "dependency_task_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "task_dependency_pkey" PRIMARY KEY ("dependency_id")
);

-- AddForeignKey
ALTER TABLE "subtask" ADD CONSTRAINT "subtask_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependency" ADD CONSTRAINT "task_dependency_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;
