import prisma from "@src/db";
import { TypePayloadDashboard } from "@modules/dashboad/dashboardModel";
import { TypePayloadProject } from "@modules/project/projectModel";

export const DashboardRepository = {
    // ดึงข้อมูล Dashboard ทั้งหมด
    findAllAsync: async () => {
        return prisma.project.findMany({
            select: {
                project_id: true,
                project_name: true,
                budget: true,
                actual: true,
                start_date: true,
                end_date: true,
                status: true,
            },
        });
    },

    // ดึงข้อมูล Dashboard ตาม project_id
    findById: async (project_id: string) => {
        return prisma.project.findUnique({
            where: { project_id },
            select: {
                project_id: true,
                project_name: true,
                budget: true,
                actual: true,
                start_date: true,
                end_date: true,
                status: true,
            },
        });
    },
};