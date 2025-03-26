import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { subtaskService } from "@modules/subtask/subtaskService";
import { CreateSubTaskSchema, UpdateSubTaskSchema, DeleteSubTaskSchema } from "@modules/subtask/subtaskModel";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import rolegrop5 from "@common/middleware/roleGroup5"; // สำหรับสิทธิ์การจัดการ

export const subtaskRouter = (() => {
  const router = express.Router();

  // GET SubTasks
  router.get("/get",
        authenticateJWT, 
        async (req: Request, res: Response) => {
        const ServiceResponse = await subtaskService.findAll();
        handleServiceResponse(ServiceResponse, res);
    });

  // CREATE SubTask
  router.post("/create",
        authenticateJWT,
        validateRequest(CreateSubTaskSchema), async (req: Request, res: Response) => {
        const payload = req.body;
        const ServiceResponse = await subtaskService.create(payload);
        handleServiceResponse(ServiceResponse, res);
    });

  // UPDATE SubTask
  router.put("/update",
        authenticateJWT,
        validateRequest(UpdateSubTaskSchema),async (req: Request, res: Response) => {
        const { subtask_id } = req.body;
        const payload = req.body;
        const ServiceResponse = await subtaskService.update(subtask_id, payload);
        handleServiceResponse(ServiceResponse, res);
    });

  // DELETE SubTask
  router.delete("/delete/:subtask_id",
        authenticateJWT,
        validateRequest(DeleteSubTaskSchema), async (req: Request, res: Response) => {
        const { subtask_id } = req.params;
        const ServiceResponse = await subtaskService.delete(subtask_id);
        handleServiceResponse(ServiceResponse, res);
    });

  return router;
})();
