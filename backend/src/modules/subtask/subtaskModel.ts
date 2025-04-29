import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของ SubTask
export type TypePayloadSubTask = {
  task_id?: string | null;
  subtask_name: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
};

// Schema สำหรับการสร้าง SubTask
export const CreateSubTaskSchema = z.object({
  body: z.object({
    task_id: z.string().uuid().nullable().optional(),
    subtask_name: z.string().max(255),
    description: z.string().optional(),
    budget: z.number(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.string().optional(),
    created_at: z.string().optional(),
    created_by: z.string().optional(),
    updated_at: z.string().optional(),
    updated_by: z.string().optional(),
  }),
});

// Schema สำหรับการอัปเดต SubTask
export const UpdateSubTaskSchema = z.object({
  body: z.object({
    subtask_id: z.string().uuid(),
    task_id: z.string().uuid().nullable().optional(),
    subtask_name: z.string().max(255).optional(),
    description: z.string().optional(),
    budget: z.number().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.string().optional(),
    updated_at: z.string().optional(),
    updated_by: z.string().optional(), // ต้องมี updated_by เพื่อบันทึกว่าใครแก้ไข
  }),
});

// Schema สำหรับการลบ SubTask
export const DeleteSubTaskSchema = z.object({
  params: z.object({
    subtask_id: z.string().uuid(),
  }),
});

// Schema สำหรับการบันทึกความคืบหน้าของ Subtask
export const RecordSubtaskProgressSchema = z.object({
  body: z.object({
    subtask_id: z.string().uuid(),
    progress_percent: z.number().min(0).max(100),
    description: z.string().optional(),
  }),
});