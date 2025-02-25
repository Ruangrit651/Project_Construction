import { z } from "zod";


// ประเภทข้อมูลสำหรับ payload ของโปรเจกต์
export type TypePayloadProject = {
    project_name: string;
    budget: number;   // อาจมี budget ในการอัปเดตด้วย
    actual: number;
    start_date?: string;
    end_date?: string;
    status: string;
    project_image?: string;
    // created_at?:string;
    // created_by?: string;
    // updated_at?:string;
    // updated_by?: string;
};

// Schema สำหรับการสร้างโปรเจกต์ใหม่
export const CreateProjectSchema = z.object({
    body: z.object({
        project_name: z.string().max(50),
        budget: z.number().optional(),       
        actual: z.number().optional(),  
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        status: z.string().optional(),
        project_image: z.string().optional(),
        // created_at: z.string().optional(),
        // created_by: z.string().optional(),
        // updated_at: z.string().optional(),
        // updated_by: z.string().optional()

    })
});

// Schema สำหรับการอัปเดตโปรเจกต์
export const UpdateProjectSchema = z.object({
    body: z.object({
        project_id: z.string().uuid(),
        project_name: z.string().max(50).optional(),
        actual: z.number().optional(),  
        budget: z.number().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        status: z.string().optional(),
        project_image: z.string().optional(),
        // updated_at: z.string().optional(),
        // updated_by: z.string()  // ต้องมี updated_by เพื่อบันทึกว่าใครแก้ไข
    })
});

// Schema สำหรับการลบ Project
export const DeleteProjectSchema = z.object({
    params: z.object({
        project_id: z.string().uuid(),  // รับ UUID ของ project ผ่าน body
    })
});
