import prisma from "@src/db";
import { task } from "@prisma/client";  // Import task schema from Prisma
import { TypePayloadTask } from "@modules/task/taskModel";

// Define keys to use in the select queries
export const TaskKeys = [
  "task_id",
  "project_id",
  "task_name",
  "description",
  "budget",
  "start_date",
  "end_date",
  "status",
  "created_at",
  "created_by",
  "updated_at",
  "updated_by"
];

export const TaskRepository = {
  // Get all tasks
  findAllAsync: async () => {
    return prisma.task.findMany({
      include: { projects: true }, // ดึงข้อมูลโปรเจกต์ของแต่ละ Task
    });
  },

  // Find task by ID
  findById: async (task_id: string) => {
    return prisma.task.findUnique({
        where: { task_id },
    });
  },


  // Find task by name (or any other unique key)
  findByName: async <Key extends keyof task>(
    task_name: string,
    keys = TaskKeys as Key[]
  ) => {
    return prisma.task.findFirst({
      where: { task_name: task_name },
      select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    }) as Promise<Pick<task, Key> | null>;
  },

  // Create a new task
  create: async (payload: TypePayloadTask) => {
    const task_name = payload.task_name.trim();
    const startDate = payload.start_date;
    const setPayload: any = {
      project_id:payload.project_id,
      task_name: task_name,
      description: payload.description,
      budget: payload.budget,
      start_date: startDate,
      end_date: payload.end_date,
      status: payload.status,

    };

    return await prisma.task.create({
      data: setPayload
    });
  },

  // Update task by task_id
  update: async (task_id: string, payload: Partial<TypePayloadTask>) => {
    return await prisma.task.update({
      where: { task_id: task_id },
      data: payload
    });
  },

  // Delete a task by task_id
  delete: async (task_id: string) => {
    return await prisma.task.delete({
      where: { task_id: task_id }
    });
  }
};
