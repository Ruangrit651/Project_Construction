import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของงาน (plan)
export type TypePayloadPlan = {
    plan_id: string; 
    description: string;
    progress_task: number;
    // created_at: DateTime;
    // created_by: string | null; // ใช้ | null หากต้องการให้สามารถเป็น null ได้
    // updated_at: DateTime;
    // updated_by: string;
};

// Schema สำหรับการสร้าง Plan ใหม่
export const CreatePlanSchema = z.object({
    body: z.object({
      plan_id: z.string().nonempty("Plan ID is required"), // ตรวจสอบว่า plan_id ต้องไม่ว่าง
      description: z.string().nonempty("Description is required"), // ตรวจสอบว่า description ต้องไม่ว่าง
      progress_task: z.number().int().min(0).max(100).default(0), // จำนวนเต็มระหว่าง 0 ถึง 100, ค่าเริ่มต้นเป็น 0
      start_date: z.date().optional(), // วันที่เริ่มต้น (สามารถไม่ใส่ได้)
      end_date: z.date().optional(), // วันที่สิ้นสุด (สามารถไม่ใส่ได้)
      status: z.enum(["not started", "in progress", "completed"]).default("not started"), // สถานะต้องเป็นค่าที่กำหนด
      created_by: z.string().nonempty("Creator ID is required"), // ผู้สร้างต้องมีค่า
    }), 
});

// Schema สำหรับการอัปเดต Plan
export const UpdatePlanSchema = z.object({
    body: z.object({
      plan_id: z.string().nonempty("Plan ID is required"), // ตรวจสอบว่า plan_id ต้องไม่ว่าง
      description: z.string().optional(), // อัปเดต description ได้ แต่ไม่บังคับ
      progress_task: z.number().int().min(0).max(100), // จำนวนเต็มระหว่าง 0 ถึง 100 สำหรับเปอร์เซ็นต์ความคืบหน้า
      updated_by: z.string().optional(), // อัปเดตผู้แก้ไขได้ แต่ไม่บังคับ
    }),
});

// Schema สำหรับการลบ Plan
export const DeletePlanSchema = z.object({
    body: z.object({
      plan_id: z.string().nonempty("Plan ID is required"), // ตรวจสอบว่า plan_id ต้องไม่ว่าง
     }),
});