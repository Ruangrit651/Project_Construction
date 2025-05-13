import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { relationService } from "@modules/relation/relationService";
import { 
    CreateRelationSchema, 
    GetRelationsByProjectSchema, 
    GetRelationsByUserSchema, 
    DeleteRelationSchema,
    DeleteRelationByProjectUserSchema
} from "@modules/relation/relationModel";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import rolegrop1 from "@common/middleware/roleGroup1";
import rolegrop2 from "@common/middleware/roleGroup2";

export const relationRouter = (() => {
    const router = express.Router();

    // GET all relations
    router.get("/get", 
        authenticateJWT,
        rolegrop2, 
        async (req: Request, res: Response) => {
            const serviceResponse = await relationService.findAll();
            handleServiceResponse(serviceResponse, res);
        }
    );

    // GET relations by project_id
    router.get("/project/:project_id", 
        authenticateJWT,
        rolegrop2,
        validateRequest(GetRelationsByProjectSchema), 
        async (req: Request, res: Response) => {
            const { project_id } = req.params;
            const serviceResponse = await relationService.findByProjectId(project_id);
            handleServiceResponse(serviceResponse, res);
        }
    );

    // GET relations by user_id
    router.get("/user/:user_id", 
        authenticateJWT,
        rolegrop2,
        validateRequest(GetRelationsByUserSchema), 
        async (req: Request, res: Response) => {
            const { user_id } = req.params;
            const serviceResponse = await relationService.findByUserId(user_id);
            handleServiceResponse(serviceResponse, res);
        }
    );

    // CREATE new relation
    router.post("/create", 
        authenticateJWT,
        rolegrop1,
        validateRequest(CreateRelationSchema), 
        async (req: Request, res: Response) => {
            const payload = req.body;
            const serviceResponse = await relationService.create(payload);
            handleServiceResponse(serviceResponse, res);
        }
    );

    // DELETE relation by id
    router.delete("/delete/:relation_id", 
        authenticateJWT,
        rolegrop1,
        validateRequest(DeleteRelationSchema), 
        async (req: Request, res: Response) => {
            const { relation_id } = req.params;
            const serviceResponse = await relationService.delete(relation_id);
            handleServiceResponse(serviceResponse, res);
        }
    );

    // DELETE relation by project_id and user_id
    router.delete("/remove", 
        authenticateJWT,
        rolegrop1,
        validateRequest(DeleteRelationByProjectUserSchema), 
        async (req: Request, res: Response) => {
            const { project_id, user_id } = req.body;
            const serviceResponse = await relationService.deleteByProjectAndUser(project_id, user_id);
            handleServiceResponse(serviceResponse, res);
        }
    );

    return router;
})();