import express, {Request, Response} from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { projectService } from "@modules/project/projectService";
import { CreateProjectSchema } from "@modules/project/projectModel";
import { UpdateProjectSchema, DeleteProjectSchema } from "@modules/project/projectModel";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import rolegrop1 from "@common/middleware/roleGroup1";
import rolegrop2 from "@common/middleware/roleGroup2";
import rolegrop5 from "@common/middleware/roleGroup5";
import { z } from "zod";

const ProjectUserSchema = z.object({
    params: z.object({
        project_id: z.string().uuid(),
    }),
    body: z.object({
        user_id: z.string().uuid(),
    }),
});

export const projectRouter = (() => {
    const router = express.Router();

    // GET users in project
    router.get("/users/:project_id", 
        authenticateJWT,
        rolegrop2,
        validateRequest(z.object({
            params: z.object({
                project_id: z.string().uuid(),
            })
        })), 
        async (req: Request, res: Response) => {
            const { project_id } = req.params;
            const serviceResponse = await projectService.getProjectUsers(project_id);
            handleServiceResponse(serviceResponse, res);
        }
    );

    // ADD user to project
    router.post("/users/:project_id", 
        authenticateJWT,
        rolegrop1,
        validateRequest(ProjectUserSchema), 
        async (req: Request, res: Response) => {
            const { project_id } = req.params;
            const { user_id } = req.body;
            const serviceResponse = await projectService.addUserToProject(project_id, user_id, req.user.userId);
            handleServiceResponse(serviceResponse, res);
        }
    );

    // REMOVE user from project
    router.delete("/users/:project_id", 
        authenticateJWT,
        rolegrop1,
        validateRequest(ProjectUserSchema), 
        async (req: Request, res: Response) => {
            const { project_id } = req.params;
            const { user_id } = req.body;
            const serviceResponse = await projectService.removeUserFromProject(project_id, user_id, req.user.userId);
            handleServiceResponse(serviceResponse, res);
        }
    );
    

    // GET all projects
    router.get("/get", 
        authenticateJWT,
        rolegrop2, 
        async (req: Request, res: Response) => {
        const ServiceResponse = await projectService.findAll();
        handleServiceResponse(ServiceResponse, res);
    });


    router.post("/create", 
        authenticateJWT,
        rolegrop1,
        validateRequest(CreateProjectSchema), async (req: Request, res: Response) => {
        const payload = req.body;
        payload.user_id = req.user.userId; // Set user_id from the authenticated user
        payload.created_by = req.user.userId; 
        payload.updated_by = req.user.userId; 
        const ServiceResponse = await projectService.create(payload);
        handleServiceResponse(ServiceResponse, res);
    });

    // UPDATE a project
    router.put("/update", 
        authenticateJWT,
        rolegrop1,
        validateRequest(UpdateProjectSchema), async (req: Request, res: Response) => {
        const {project_id} = req.body;
        const payload = req.body;
        payload.updated_by = req.user.userId; // Set updated_by from the authenticated user
        const ServiceResponse = await projectService.update(project_id, payload);
        handleServiceResponse(ServiceResponse, res);
    });

    // DELETE a project
    router.delete("/delete/:project_id", 
        authenticateJWT,
        rolegrop1,
        validateRequest(DeleteProjectSchema), async (req: Request, res: Response) => {
        const { project_id } = req.params; // Extract project_id from the body
        const ServiceResponse = await projectService.delete(project_id);
        handleServiceResponse(ServiceResponse, res);
    });

    router.get(
        "/manager",
        authenticateJWT,
        rolegrop5,
        async (req: Request, res: Response) => {
          const managerId = req.user.userId;
          const serviceResponse = await projectService.findByManagerId(managerId);
          handleServiceResponse(serviceResponse, res);
        }
      );


    return router;
})();

//test
