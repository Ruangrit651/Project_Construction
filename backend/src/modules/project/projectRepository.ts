import prisma from "@src/db"; 
import { project } from "@prisma/client";  
import { TypePayloadProject } from "@modules/project/projectModel";

export const Keys = [
    "project_id",
    "project_name",
    "actual",
    "budget",
    "start_date",
    "end_date",
    "status",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by"
]


export const ProjectRepository = {
    // ค้นหาโปรเจกต์ทั้งหมด
    findAllAsync: async () => {
        return prisma.project.findMany({
            select: {
                project_id: true,
                project_name: true,
                actual: true,
                budget: true,  
                start_date: true,
                end_date: true,
                status: true,
                // created_at: true,
                // created_by: true,
                // updated_at: true,
                // updated_by: true
            }
        });
    },

    // ค้นหาโปรเจกต์ตาม project_id
    findById: async (project_id: string) => {
        return prisma.project.findUnique({
            where: { project_id: project_id },
            select: {
                project_id: true,
                project_name: true,
                actual: true,
                budget: true,
                start_date: true,
                end_date: true,
                status: true,
                project_image: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true
            }
        });
    },
    
    
    // ค้นหาโปรเจกต์ตามชื่อ
    findByName: async <Key extends keyof project>(
        project_name: string,
        keys = Keys as Key[]
    ) => {
        return prisma.project.findUnique({
            where: { project_name: project_name },
            select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
        }) as Promise<Pick<project, Key> | null>;
    },

    
    // สร้างโปรเจกต์ใหม่
    create: async (payload: TypePayloadProject) => {
        const project_name = payload.project_name.trim();
        const startDate = payload.start_date;
        const setPayload: any = {
            project_name: project_name,
            actual: payload.actual,
            budget: payload.budget,
            start_date: startDate,
            end_date: payload.end_date,
            status: payload.status,
            project_image: payload.project_image
        }

        return await prisma.project.create({
            data: setPayload
        });
    },

    // อัปเดตโปรเจกต์
    update: async (project_id: string, payload: Partial<TypePayloadProject>) => {
        return await prisma.project.update({
            where: { project_id: project_id },
            data: payload
        });
    },

    // ลบโปรเจกต์
    delete: async (project_id: string) => {
        return await prisma.project.delete({
            where: { project_id: project_id }
        });
    }
}
