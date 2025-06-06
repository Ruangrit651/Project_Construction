import prisma from "@src/db";
import { resource } from "@prisma/client";
import { TypePayloadResource } from "@modules/resource/resourceModel";

export const ResourceKeys = [
  "resource_id",
  "resource_name",
  "resource_type",
  "cost",
  "total",
  "quantity",
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
];

export const ResourceRepository = {
  // ค้นหาทรัพยากรทั้งหมด
  findAllAsync: async (): Promise<resource[]> => {
    return prisma.resource.findMany({
      select: {
        resource_id: true,
        resource_name: true,
        resource_type: true,
        cost: true,
        total: true,
        quantity: true,
        task_id: true, // เพิ่ม task_id
        subtask_id: true, // เพิ่ม subtask_id
        tasks: { select: { task_name: true } }, // ดึงชื่อ Task
        created_at: true,
        created_by: true,
        updated_at: true,
        updated_by: true,
      },
    });
  },

  // ค้นหาทรัพยากรตาม resource_id
  findById: async (resource_id: string): Promise<resource | null> => {
    return prisma.resource.findUnique({
      where: { resource_id: resource_id },
      select: {
        task_id: true,
        subtask_id: true, // เพิ่ม subtask_id
        resource_id: true,
        resource_name: true,
        resource_type: true,
        cost: true,
        total: true,
        quantity: true,
        created_at: true,
        created_by: true,
        updated_at: true,
        updated_by: true,
      },
    });
  },

  // ค้นหาทรัพยากรตามชื่อ
  findByName: async (resource_name: string): Promise<resource | null> => {
    return prisma.resource.findFirst({
      where: { resource_name: resource_name },
    });
  },

  // สร้างทรัพยากรใหม่
  create: async (payload: TypePayloadResource): Promise<resource> => {
    const resource_name = payload.resource_name.trim();
    const setPayload = {
      resource_name: resource_name,
      resource_type: payload.resource_type,
      cost: payload.cost,
      total: payload.total,
      quantity: payload.quantity,
      task_id: payload.task_id,
      subtask_id: payload.subtask_id, // เพิ่ม subtask_id
      created_at: payload.created_at,
      created_by: payload.created_by,
      updated_at: payload.updated_at,
      updated_by: payload.updated_by,
    };

    return prisma.resource.create({
      data: setPayload,
    });
  },

  // อัปเดตทรัพยากร
  update: async (
    resource_id: string,
    payload: Partial<TypePayloadResource>
  ): Promise<resource> => {
    return prisma.resource.update({
      where: { resource_id: resource_id },
      data: payload,
    });
  },

  // ลบทรัพยากร
  delete: async (resource_id: string): Promise<resource> => {
    return prisma.resource.delete({
      where: { resource_id: resource_id },
    });
  },

  // ค้นหาทรัพยากรตาม task_id
  summaryByType: async (project_ids?: string[]) => {
    if (project_ids && project_ids.length > 0) {
        return await prisma.resource.groupBy({
        by: ['resource_type'],
        where: {
          tasks: {
            project_id: {
              in: project_ids,
            },
          },
        },
        _sum: {
          quantity: true,
          cost: true,
          total: true, // ถ้าใช้ฟิลด์ total ในฐานข้อมูลที่คำนวณไว้แล้ว
        },
      });
    
    } else {
      return prisma.resource.groupBy({
        by: ["resource_type"],
        _sum: {
          quantity: true,
          total: true,
        },
      });
    }
  }
};
