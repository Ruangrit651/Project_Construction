import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { dashboardService } from "./dashboardService";
import { GetDashboardSchema } from "./dashboardModel";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import rolegrop2 from "@common/middleware/roleGroup2";

export const dashboardRouter = (() => {
    const router = express.Router();

    // GET all dashboard data
    router.get(
        "/get",
        authenticateJWT,
        async (req: Request, res: Response) => {
            const ServiceResponse = await dashboardService.findAll();
            handleServiceResponse(ServiceResponse, res);
        }
    );

    // GET dashboard data by project_id
    router.get(
        "/get/:project_id",
        authenticateJWT,
        validateRequest(GetDashboardSchema),
        async (req: Request, res: Response) => {
            const { project_id } = req.params;
            const ServiceResponse = await dashboardService.findById(project_id);
            handleServiceResponse(ServiceResponse, res);
        }
    );

    return router;
})();