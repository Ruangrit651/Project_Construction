import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { userService } from "@modules/user/userService";
import { CreateUserSchema, UpdateUserSchema, DeleteUserSchema, ToggleUserStatusSchema } from "@modules/user/userModel";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import rolegrop1 from "@common/middleware/roleGroup1";
import { z } from "zod";

export const userRouter = (() => {
    const router = express.Router();

    // GET all users
    router.get("/get",
        authenticateJWT,
        rolegrop1,
        async (req: Request, res: Response) => {
            const serviceResponse = await userService.findAll();
            handleServiceResponse(serviceResponse, res);
        });

    // GET projects associated with user
    router.get("/projects/:user_id",
        authenticateJWT,
        rolegrop1,
        validateRequest(z.object({
            params: z.object({
                user_id: z.string().uuid(),
            })
        })),
        async (req: Request, res: Response) => {
            const { user_id } = req.params;
            const serviceResponse = await userService.getUserProjects(user_id);
            handleServiceResponse(serviceResponse, res);
        }
    );

    // GET current user
    router.get("/current",
        authenticateJWT,
        async (req: Request, res: Response) => {
            const userId = req.user.userId; // This comes from JWT token
            const serviceResponse = await userService.getCurrentUser(userId);
            handleServiceResponse(serviceResponse, res);
        }
    );

    // CREATE a user
    router.post("/create",
        authenticateJWT,
        rolegrop1,
        validateRequest(CreateUserSchema), async (req: Request, res: Response) => {
            const payload = req.body;
            payload.created_by = req.user.userId;
            payload.updated_by = req.user.userId;
            const serviceResponse = await userService.create(payload);
            handleServiceResponse(serviceResponse, res);
        });

    // UPDATE a user
    router.put("/update",
        authenticateJWT,
        rolegrop1,
        validateRequest(UpdateUserSchema), async (req: Request, res: Response) => {
            const { user_id } = req.body; // user_id ควรอยู่ใน body
            const payload = req.body;
            payload.updated_by = req.user.userId; // Set updated_by from the authenticated user
            const serviceResponse = await userService.update(user_id, payload);
            handleServiceResponse(serviceResponse, res);
        });

    // DELETE a user using body
    router.delete("/delete/:user_id",
        authenticateJWT,
        rolegrop1,
        validateRequest(DeleteUserSchema), async (req: Request, res: Response) => {
            const { user_id } = req.params; // รับ user_id จาก body
            const serviceResponse = await userService.delete(user_id);
            handleServiceResponse(serviceResponse, res);
        });

    router.patch("/toggle-status/:user_id",
        authenticateJWT,
        rolegrop1,
        validateRequest(ToggleUserStatusSchema),
        async (req: Request, res: Response) => {
            const { user_id } = req.params;
            const { is_active } = req.body;
            const updated_by = req.user.userId;

            const serviceResponse = await userService.toggleUserStatus(
                user_id,
                is_active,
                updated_by
            );

            handleServiceResponse(serviceResponse, res);
        }
    );

    return router;


})();

// กำหนดเส้น Api 



