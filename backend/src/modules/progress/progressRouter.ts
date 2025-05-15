import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { progressService } from "@modules/progress/progressService";
import {
  CreateProgressSchema,
  UpdateProgressSchema,
  GetProgressByIdSchema,
  GetTaskProgressSchema,
  GetSubtaskProgressSchema,
  DeleteProgressSchema
} from "@modules/progress/progressModel";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import rolegrop5 from "@common/middleware/roleGroup5"; // สำหรับสิทธิ์การจัดการ

export const progressRouter = (() => {
  const router = express.Router();

  // ดึงข้อมูลความคืบหน้าทั้งหมด
  router.get(
    "/get",
    authenticateJWT,
    async (req: Request, res: Response) => {
      const serviceResponse = await progressService.findAll();
      handleServiceResponse(serviceResponse, res);
    }
  );

  // บันทึกความคืบหน้า
  router.post(
    "/create",
    authenticateJWT,
    validateRequest(CreateProgressSchema),
    async (req: Request, res: Response) => {
      const payload = req.body;

      // แปลง date_recorded จาก string เป็น Date ถ้ามี
      if (payload.date_recorded) {
        payload.date_recorded = new Date(payload.date_recorded);
      }

      // ตั้งค่า created_by และ updated_by จากข้อมูลผู้ใช้ที่ login
      payload.created_by = req.user.userId;
      payload.updated_by = req.user.userId;

      const serviceResponse = await progressService.create(payload);
      handleServiceResponse(serviceResponse, res);
    }
  );

  // อัปเดตความคืบหน้า
  router.put(
    "/update",
    authenticateJWT,
    validateRequest(UpdateProgressSchema),
    async (req: Request, res: Response) => {
      const { progress_id, ...payload } = req.body;

      // แปลง date_recorded จาก string เป็น Date ถ้ามี
      if (payload.date_recorded) {
        payload.date_recorded = new Date(payload.date_recorded);
      }

      // ตั้งค่า updated_by จากข้อมูลผู้ใช้ที่ login
      payload.updated_by = req.user.userId;

      const serviceResponse = await progressService.update(progress_id, payload);
      handleServiceResponse(serviceResponse, res);
    }
  );

  // ลบข้อมูลความคืบหน้า
  router.delete(
    "/delete/:progress_id",
    authenticateJWT,
    validateRequest(DeleteProgressSchema),
    async (req: Request, res: Response) => {
      const { progress_id } = req.params;
      const serviceResponse = await progressService.delete(progress_id);
      handleServiceResponse(serviceResponse, res);
    }
  );

  // ดึงประวัติความคืบหน้าของ task
  router.get(
    "/task/:task_id",
    authenticateJWT,
    validateRequest(GetTaskProgressSchema),
    async (req: Request, res: Response) => {
      const { task_id } = req.params;
      const serviceResponse = await progressService.getTaskProgressHistory(task_id);
      handleServiceResponse(serviceResponse, res);
    }
  );

  // ดึงประวัติความคืบหน้าของ subtask
  router.get(
    "/subtask/:subtask_id",
    authenticateJWT,
    validateRequest(GetSubtaskProgressSchema),
    async (req: Request, res: Response) => {
      const { subtask_id } = req.params;
      const serviceResponse = await progressService.getSubtaskProgressHistory(subtask_id);
      handleServiceResponse(serviceResponse, res);
    }
  );

  router.get("/project/:project_id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      const { project_id } = req.params;
      const serviceResponse = await progressService.calculateProjectProgress(project_id);
      handleServiceResponse(serviceResponse, res);
    }
  );

  // เพิ่ม endpoint สำหรับดึงข้อมูลความคืบหน้าของทั้ง tasks และ subtasks ในโปรเจค
  router.get("/project-detailed/:project_id",
    authenticateJWT,
    async (req: Request, res: Response) => {
      const { project_id } = req.params;
      const serviceResponse = await progressService.getDetailedProjectProgress(project_id);
      handleServiceResponse(serviceResponse, res);
    }
  );



  return router;
})();