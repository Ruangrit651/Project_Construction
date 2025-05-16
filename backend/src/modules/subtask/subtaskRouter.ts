import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { subtaskService } from "@modules/subtask/subtaskService";
import {
  CreateSubTaskSchema, UpdateSubTaskSchema, DeleteSubTaskSchema, RecordSubtaskProgressSchema, UpdateSubTaskStartDateSchema,
  UpdateSubTaskEndDateSchema,
  UpdateSubTaskDatesSchema
} from "@modules/subtask/subtaskModel";
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
      payload.created_by = req.user.userId; // Set created_by from the authenticated user
      payload.updated_by = req.user.userId; // Set updated_by from the authenticated user
      const ServiceResponse = await subtaskService.create(payload);
      handleServiceResponse(ServiceResponse, res);
    });

  // UPDATE SubTask
  router.put("/update",
    authenticateJWT,
    validateRequest(UpdateSubTaskSchema), async (req: Request, res: Response) => {
      const { subtask_id } = req.body;
      const payload = req.body;
      payload.updated_by = req.user.userId; // Set updated_by from the authenticated user
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

  // RECORD Progress for SubTask
  router.post("/progress",
    authenticateJWT,
    validateRequest(RecordSubtaskProgressSchema), async (req: Request, res: Response) => {
      const { subtask_id, progress_percent, description } = req.body;
      const updated_by = req.user.userId;
      const ServiceResponse = await subtaskService.recordProgress(
        subtask_id,
        progress_percent,
        description,
        updated_by
      );
      handleServiceResponse(ServiceResponse, res);
    });

  router.put("/updatestartdate",
    authenticateJWT,
    rolegrop5,
    validateRequest(UpdateSubTaskStartDateSchema),
    async (req: Request, res: Response) => {
      const { subtask_id, start_date } = req.body;
      const payload = {
        start_date,
        updated_by: req.user.userId, // Set updated_by from the authenticated user
      };
      const ServiceResponse = await subtaskService.updateStartDate(subtask_id, payload);
      handleServiceResponse(ServiceResponse, res);
    }
  );

  // UPDATE end date
  router.put("/updateenddate",
    authenticateJWT,
    rolegrop5,
    validateRequest(UpdateSubTaskEndDateSchema),
    async (req: Request, res: Response) => {
      const { subtask_id, end_date } = req.body;
      const payload = {
        end_date,
        updated_by: req.user.userId, // Set updated_by from the authenticated user
      };
      const ServiceResponse = await subtaskService.updateEndDate(subtask_id, payload);
      handleServiceResponse(ServiceResponse, res);
    }
  );

  // UPDATE both dates together
  router.put("/updatedates",
    authenticateJWT,
    rolegrop5,
    validateRequest(UpdateSubTaskDatesSchema),
    async (req: Request, res: Response) => {
      const { subtask_id, start_date, end_date } = req.body;
      const payload = {
        start_date,
        end_date,
        updated_by: req.user.userId, // Set updated_by from the authenticated user
      };
      const ServiceResponse = await subtaskService.updateDates(subtask_id, payload);
      handleServiceResponse(ServiceResponse, res);
    }
  );

  return router;
})();