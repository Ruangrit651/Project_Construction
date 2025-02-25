import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { roleService } from "@modules/role/roleService";
import { CreateRoleSchema, UpdateRoleSchema, DeleteRoleSchema } from "@modules/role/roleModel";

export const roleRouter = (() => {
    const router = express.Router();

    // GET all roles
    router.get("/get", async (req: Request, res: Response) => {
        const ServiceResponse = await roleService.findAll();
        handleServiceResponse(ServiceResponse, res);
    });

    // CREATE a role
    router.post("/create", validateRequest(CreateRoleSchema), async (req: Request, res: Response) => {
        const payload = req.body;
        const ServiceResponse = await roleService.create(payload);
        handleServiceResponse(ServiceResponse, res);
    });

    // UPDATE a role
    router.put("/update", validateRequest(UpdateRoleSchema), async (req: Request, res: Response) => {
        const { role_id } = req.body;
        const payload = req.body;
        const ServiceResponse = await roleService.update(role_id, payload);
        handleServiceResponse(ServiceResponse, res);
    });

    // DELETE a role
    router.delete("/delete", validateRequest(DeleteRoleSchema), async (req: Request, res: Response) => {
        const { role_id } = req.body;
        const ServiceResponse = await roleService.delete(role_id);
        handleServiceResponse(ServiceResponse, res);
    });

    return router;
})();
