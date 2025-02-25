import prisma from "@src/db";
import { TypePayloadRole } from "@modules/role/roleModel";

export const RoleKeys = [
    "role_id",
    "name"
];

export const RoleRepository = {
    // ค้นหา Roles ทั้งหมด
    findAllAsync: async () => {
        return prisma.role.findMany({
            select: {
                role_id: true,
                name: true,
            },
        });
    },

    // ค้นหา Role ตาม role_id
    findById: async (role_id: string) => {
        return prisma.role.findUnique({
            where: { role_id: role_id },
            select: {
                role_id: true,
                name: true,
            },
        });
    },

    // ค้นหา Role ตามชื่อ
    findByName: async (name: string) => {
        return prisma.role.findUnique({
            where: { name: name },
        });
    },

    // สร้าง Role ใหม่
    create: async (payload: TypePayloadRole) => {
        const name = payload.name.trim();
        return prisma.role.create({
            data: { name },
        });
    },

    // อัปเดต Role
    update: async (role_id: string, payload: Partial<TypePayloadRole>) => {
        return prisma.role.update({
            where: { role_id: role_id },
            data: payload,
        });
    },

    // ลบ Role
    delete: async (role_id: string) => {
        return prisma.role.delete({
            where: { role_id: role_id },
        });
    },
};
