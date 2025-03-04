import prisma from "@src/db";
import { subtask } from "@prisma/client";
import { TypePayloadSubTask } from "@modules/subtask/subtaskModel";

// Define keys to use in the select queries
export const SubTaskKeys = [
  "subtask_id",
  "task_id",
  "subtask_name",
  "description",
  "budget",
  "start_date",
  "end_date",
  "status",
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
];

export const SubTaskRepository = {
  // Get all subtasks
  findAllAsync: async () => {
    return prisma.subtask.findMany({
      include: { task: true },
    });
  },

  // Find subtask by ID
  findById: async (subtask_id: string) => {
    return prisma.subtask.findUnique({
      where: { subtask_id },
    });
  },

  // Find subtask by name
  findByName: async <Key extends keyof subtask>(
    subtask_name: string,
    keys = SubTaskKeys as Key[]
  ) => {
    return prisma.subtask.findFirst({
      where: { subtask_name: subtask_name },
      select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    }) as Promise<Pick<subtask, Key> | null>;
  },

  // Create a new subtask
  create: async (payload: TypePayloadSubTask) => {
    const subtask_name = payload.subtask_name.trim();
    const startDate = payload.start_date;
    const setPayload: any = {
      task_id: payload.task_id,
      subtask_name: subtask_name,
      description: payload.description,
      budget: payload.budget,
      start_date: startDate,
      end_date: payload.end_date,
      status: payload.status,
    };

    return await prisma.subtask.create({
      data: setPayload,
    });
  },

  // Update subtask by subtask_id
  update: async (subtask_id: string, payload: Partial<TypePayloadSubTask>) => {
    return await prisma.subtask.update({
      where: { subtask_id: subtask_id },
      data: payload,
    });
  },

  // Delete a subtask by subtask_id
  delete: async (subtask_id: string) => {
    return await prisma.subtask.delete({
      where: { subtask_id: subtask_id },
    });
  },
};
