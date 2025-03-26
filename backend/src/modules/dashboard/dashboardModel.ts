import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของ Dashboard
export type TypePayloadDashboard = {
    project_id: string;
    project_name: string;
    budget: number;
    actual: number;
    start_date?: string;
    end_date?: string;
    status: string;
};

// Schema สำหรับการดึงข้อมูล Dashboard
export const GetDashboardSchema = z.object({
    query: z.object({
        project_id: z.string().uuid().optional(),
    }),
});