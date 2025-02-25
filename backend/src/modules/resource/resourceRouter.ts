import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { resourceService } from "@modules/resource/resourceService";
import { CreateResourceSchema, UpdateResourceSchema, DeleteResourceSchema } from "@modules/resource/resourceModel";

export const resourceRouter = (() => {
    const router = express.Router();

    // GET all resources
    router.get("/get", async (req: Request, res: Response) => {
        const ServiceResponse = await resourceService.findAll();
        handleServiceResponse(ServiceResponse, res);
    });

    // CREATE a resource
    router.post("/create", validateRequest(CreateResourceSchema), async (req: Request, res: Response) => {
        const payload = req.body;
        const ServiceResponse = await resourceService.create(payload);
        handleServiceResponse(ServiceResponse, res);
    });

    // UPDATE a resource
    router.put("/update", validateRequest(UpdateResourceSchema), async (req: Request, res: Response) => {
        const { resource_id } = req.body;
        const payload = req.body;
        const ServiceResponse = await resourceService.update(resource_id, payload);
        handleServiceResponse(ServiceResponse, res);
    });

    // DELETE a resource
    router.delete("/delete/:resource_id", validateRequest(DeleteResourceSchema), async (req: Request, res: Response) => {
        const { resource_id } = req.params;
        const ServiceResponse = await resourceService.delete(resource_id);
        handleServiceResponse(ServiceResponse, res);
    });

    return router;
})();