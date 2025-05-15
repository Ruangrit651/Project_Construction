import prisma from "@src/db";
import { Progress } from "@prisma/client";
import { TypePayloadProgress } from "@modules/progress/progressModel";

// กำหนดคีย์สำหรับใช้ในการ select
export const ProgressKeys = [
  "progress_id",
  "task_id",
  "subtask_id",
  "percent",
  "description",
  "date_recorded",
  "created_at",
  "created_by",
  "updated_at",
  "updated_by"
];

export const ProgressRepository = {
  // ค้นหาความคืบหน้าทั้งหมด
  findAllAsync: async () => {
    return prisma.progress.findMany({
      orderBy: { date_recorded: "desc" },
      include: {
        task: true,
        subtask: true,
        created: true,
      },
    });
  },

  // ค้นหาความคืบหน้าตาม ID
  findById: async (progress_id: string) => {
    return prisma.progress.findUnique({
      where: { progress_id },
      include: {
        task: true,
        subtask: true,
        created: true,
        updated: true,
      },
    });
  },

  // ค้นหาความคืบหน้าตามฟิลด์
  findByField: async <Key extends keyof Progress>(
    field: string,
    value: any,
    keys = ProgressKeys as Key[]
  ) => {
    return prisma.progress.findMany({
      where: { [field]: value },
      select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    }) as Promise<Pick<Progress, Key>[]>;
  },

  // ดึงความคืบหน้าของ task
  findByTaskId: async (task_id: string) => {
    return prisma.progress.findMany({
      where: { task_id },
      orderBy: { date_recorded: "desc" },
      include: {
        created: true,
      },
    });
  },

  // ดึงความคืบหน้าของ subtask
  findBySubtaskId: async (subtask_id: string) => {
    return prisma.progress.findMany({
      where: { subtask_id },
      orderBy: { date_recorded: "desc" },
      include: {
        created: true,
      },
    });
  },

  // ดึงความคืบหน้าล่าสุดของ task
  findLatestByTaskId: async (task_id: string) => {
    return prisma.progress.findFirst({
      where: { task_id },
      orderBy: { date_recorded: "desc" },
    });
  },

  // ดึงความคืบหน้าล่าสุดของ subtask
  findLatestBySubtaskId: async (subtask_id: string) => {
    return prisma.progress.findFirst({
      where: { subtask_id },
      orderBy: { date_recorded: "desc" },
    });
  },

  // ดึงประวัติความคืบหน้าตามระยะเวลา
  findByDateRange: async (startDate: Date, endDate: Date) => {
    return prisma.progress.findMany({
      where: {
        date_recorded: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date_recorded: "asc",
      },
      include: {
        task: true,
        subtask: true,
      },
    });
  },

  // สร้างบันทึกความคืบหน้า
  create: async (data: TypePayloadProgress) => {
    return prisma.progress.create({
      data: {
        task_id: data.task_id,
        subtask_id: data.subtask_id,
        percent: data.percent,
        description: data.description,
        date_recorded: data.date_recorded instanceof Date ? data.date_recorded : new Date(data.date_recorded || new Date()),
        created_by: data.created_by,
        updated_by: data.updated_by,
      },
      include: {
        task: true,
        subtask: true,
      },
    });
  },

  // อัปเดต progress
  update: async (progress_id: string, data: Partial<TypePayloadProgress>) => {
    return prisma.progress.update({
      where: { progress_id },
      data,
    });
  },

  // ลบ progress
  delete: async (progress_id: string) => {
    return prisma.progress.delete({
      where: { progress_id },
    });
  },


};