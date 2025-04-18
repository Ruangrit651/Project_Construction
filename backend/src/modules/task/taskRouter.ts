import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { taskService } from "@modules/task/taskService";
import { CreateTaskSchema, UpdateTaskSchema, DeleteTaskSchema, UpdateEndDateSchema, UpdateStartDateSchema } from "@modules/task/taskModel";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import rolegrop4 from "@common/middleware/roleGroup4";
import rolegrop5 from "@common/middleware/roleGroup5";

export const taskRouter = (() => {
    const router = express.Router();

    // GET all tasks
    router.get("/get",
        authenticateJWT,
        rolegrop4,
        async (req: Request, res: Response) => {
            const ServiceResponse = await taskService.findAll();
            handleServiceResponse(ServiceResponse, res);
        });

    // CREATE a task
    router.post("/create",
        authenticateJWT,
        rolegrop5,
        validateRequest(CreateTaskSchema), async (req: Request, res: Response) => {
            const payload = req.body;
            payload.created_by = req.user.userId; // Set created_by from the authenticated user
            payload.updated_by = req.user.userId; // Set updated_by from the authenticated user
            const ServiceResponse = await taskService.create(payload);
            handleServiceResponse(ServiceResponse, res);
        });

    // UPDATE a task
    router.put("/update",
        authenticateJWT,
        rolegrop5,
        validateRequest(UpdateTaskSchema), async (req: Request, res: Response) => {
            const { task_id } = req.body;
            const payload = req.body;
            payload.updated_by = req.user.userId; // Set updated_by from the authenticated user
            const ServiceResponse = await taskService.update(task_id, payload);
            handleServiceResponse(ServiceResponse, res);
        });

    // DELETE a task
    router.delete("/delete/:task_id",
        authenticateJWT,
        rolegrop5,
        validateRequest(DeleteTaskSchema), async (req: Request, res: Response) => {
            const { task_id } = req.params; // Extract task_id from the URL params
            const ServiceResponse = await taskService.delete(task_id);
            handleServiceResponse(ServiceResponse, res);
        });

    // UPDATE start date
    router.put("/updatestartdate",
        authenticateJWT,
        rolegrop5,
        validateRequest(UpdateStartDateSchema), async (req: Request, res: Response) => {
            const { task_id, start_date } = req.body;
            const payload = {
                start_date,
                updated_by: req.user.userId, // Set updated_by from the authenticated user
            };
            const ServiceResponse = await taskService.updateStartDate(task_id, payload);
            handleServiceResponse(ServiceResponse, res);
        });

    // UPDATE end date
    router.put("/updateenddate",
        authenticateJWT,
        rolegrop5,
        validateRequest(UpdateEndDateSchema), async (req: Request, res: Response) => {
            const { task_id, end_date } = req.body;
            const payload = {
                end_date,
                updated_by: req.user.userId, // Set updated_by from the authenticated user
            };
            const ServiceResponse = await taskService.updateEndDate(task_id, payload);
            handleServiceResponse(ServiceResponse, res);
        });



    return router;
})();
