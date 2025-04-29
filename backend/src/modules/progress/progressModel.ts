import { z } from "zod";

// ประเภทข้อมูลสำหรับ payload ของ Progress
export type TypePayloadProgress = {
  task_id?: string | null;
  subtask_id?: string | null;
  percent: number;
  description?: string;
  date_recorded?: string | Date;
  created_at?: string | Date;
  created_by?: string;
  updated_at?: string | Date;
  updated_by?: string;
};

// Schema สำหรับการบันทึกความคืบหน้าใหม่
export const CreateProgressSchema = z.object({
  body: z.object({
    task_id: z.string().uuid().nullable().optional(),
    subtask_id: z.string().uuid().nullable().optional(),
    percent: z.number().min(0).max(100),
    description: z.string().optional(),
    date_recorded: z.string().optional(),
    created_at: z.string().optional(),
    created_by: z.string().optional(),
    updated_at: z.string().optional(),
    updated_by: z.string().optional()
  }).refine(data => data.task_id || data.subtask_id, {
    message: "ต้องระบุ task_id หรือ subtask_id อย่างน้อยหนึ่งอย่าง"
  })
});

// Schema สำหรับการอัปเดตความคืบหน้า
export const UpdateProgressSchema = z.object({
  body: z.object({
    progress_id: z.string().uuid(),
    task_id: z.string().uuid().nullable().optional(),
    subtask_id: z.string().uuid().nullable().optional(),
    percent: z.number().min(0).max(100).optional(),
    description: z.string().optional(),
    date_recorded: z.string().optional(),
    updated_at: z.string().optional(),
    updated_by: z.string().optional()
  })
});

// Schema สำหรับการดึงความคืบหน้าตาม ID
export const GetProgressByIdSchema = z.object({
  params: z.object({
    progress_id: z.string().uuid()
  })
});

// Schema สำหรับการดึงความคืบหน้าของ Task
export const GetTaskProgressSchema = z.object({
  params: z.object({
    task_id: z.string().uuid()
  })
});

// Schema สำหรับการดึงความคืบหน้าของ Subtask
export const GetSubtaskProgressSchema = z.object({
  params: z.object({
    subtask_id: z.string().uuid()
  })
});

// Schema สำหรับการลบความคืบหน้า
export const DeleteProgressSchema = z.object({
  params: z.object({
    progress_id: z.string().uuid()
  })
});