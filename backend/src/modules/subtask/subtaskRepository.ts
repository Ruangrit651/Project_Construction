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
      include: { 
        task: true,
        progresses: {
          orderBy: { date_recorded: 'desc' },
          take: 1
        }
      },
    });
  },

  // Find subtask by ID
  findById: async (subtask_id: string) => {
    return prisma.subtask.findUnique({
      where: { subtask_id },
      include: {
        progresses: {
          orderBy: { date_recorded: 'desc' },
          take: 1
        }
      }
    });
  },

  // Find subtasks by task_id with latest progress
  findByTaskId: async (task_id: string) => {
    return prisma.subtask.findMany({
      where: { task_id },
      include: {
        progresses: {
          orderBy: { date_recorded: 'asc' },
          take: 1
        }
      },
      orderBy: { 
        created_at: 'asc'  
      }
    });
  },

  // Update multiple subtasks by task_id
  updateManyByTaskId: async (task_id: string, payload: Partial<subtask>) => {
    return prisma.subtask.updateMany({
      where: { task_id },
      data: payload,
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
      created_at: payload.created_at,
      created_by: payload.created_by,
      updated_at: payload.updated_at,
      updated_by: payload.updated_by,
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
    // ลบ progresses ทั้งหมดที่เกี่ยวข้องกับ subtask ก่อน
    await prisma.progress.deleteMany({
      where: { subtask_id: subtask_id }
    });
    
    // จากนั้นจึงลบ subtask
    return await prisma.subtask.delete({
      where: { subtask_id: subtask_id },
    });
  },
  
  // Find subtasks with their latest progress
  findWithLatestProgress: async () => {
    return prisma.subtask.findMany({
      include: {
        progresses: {
          orderBy: { date_recorded: 'desc' },
          take: 1
        },
        task: true
      },
      orderBy: { created_at: 'desc' }
    });
  },
  
  // Find completed subtasks of a specific task
  findCompletedByTaskId: async (task_id: string) => {
    return prisma.subtask.findMany({
      where: { 
        task_id,
        status: 'completed'
      },
      include: {
        progresses: {
          orderBy: { date_recorded: 'desc' },
          take: 1
        }
      }
    });
  }
};