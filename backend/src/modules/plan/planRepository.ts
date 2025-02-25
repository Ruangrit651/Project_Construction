import prisma from "@src/db";
import { TypePayloadPlan } from "@modules/plan/planModel"; // Import ประเภทข้อมูลของ payload ของ Plan
import { plan } from "@prisma/client";

export const PlanKeys = [
    "plan_id",
    "description",
    "progress_task",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by"
];

export const PlanRepository = {
    // ค้นหา Plan ทั้งหมด
    findAllAsync: async () => {
        return prisma.plan.findMany({
            select: {
                plan_id: true,
                description: true,
                progress_task: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true,
            }
        });
    },

    // ค้นหา Plan ตาม plan_id
    findById: async (plan_id: string) => {
        return prisma.plan.findUnique({
            where: { plan_id: plan_id },
            select: {
                plan_id: true,
                description: true,
                progress_task: true,
                // created_at: true,
                // created_by: true,
                // updated_at: true,
                // updated_by: true,
            }
        });
    },
    
    // ค้นหา Plan ตาม description
    findByDescription: async <Key extends keyof plan>(
        description: string,
        keys = PlanKeys as Key[]
    ) => {
        return prisma.plan.findMany({
            where: { description: { contains: description } },
            select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
        }) as Promise<Pick<plan, Key>[] | null>;
    },

    // สร้าง Plan ใหม่
    create: async (payload: TypePayloadPlan) => {
        const setPayload = {
            description: payload.description,
            progress_task: payload.progress_task,
            // created_by: payload.created_by,
            // updated_by: payload.updated_by,
        };

        return await prisma.plan.create({
            data: setPayload
        });
    },

    // อัปเดต Plan
    update: async (plan_id: string, payload: Partial<TypePayloadPlan>) => {
        return await prisma.plan.update({
            where: { plan_id: plan_id },
            data: payload,
        });
    },

    // ลบ Plan
    delete: async (plan_id: string) => {
        return await prisma.plan.delete({
            where: { plan_id: plan_id },
        });
    }
};
