import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { resourceService } from "@modules/resource/resourceService";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import { CreateResourceSchema, UpdateResourceSchema, DeleteResourceSchema } from "@modules/resource/resourceModel";

export const resourceRouter = (() => {
    const router = express.Router();

    // GET all resources
    router.get("/get", async (req: Request, res: Response) => {
        const ServiceResponse = await resourceService.findAll();
        handleServiceResponse(ServiceResponse, res);
    });

    // CREATE a resource
    router.post("/create",authenticateJWT
        ,validateRequest
        (CreateResourceSchema), async (req: Request, res: Response) => {
        const payload = req.body;
        payload.created_by = req.user.userId; 
        payload.updated_by = req.user.userId; 
        const ServiceResponse = await resourceService.create(payload);
        handleServiceResponse(ServiceResponse, res);
    });

    // UPDATE a resource
    router.put("/update",authenticateJWT, validateRequest(UpdateResourceSchema), async (req: Request, res: Response) => {
        const { resource_id } = req.body;
        const payload = req.body;
        payload.updated_by = req.user.userId; 
        const ServiceResponse = await resourceService.update(resource_id, payload);
        handleServiceResponse(ServiceResponse, res);
    });

    // DELETE a resource
    router.delete("/delete/:resource_id",authenticateJWT, validateRequest(DeleteResourceSchema), async (req: Request, res: Response) => {
        const { resource_id } = req.params;
        const ServiceResponse = await resourceService.delete(resource_id);
        handleServiceResponse(ServiceResponse, res);
    });

    return router;
})();