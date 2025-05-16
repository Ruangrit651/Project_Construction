import express, { Request, Response } from "express";
import { handleServiceResponse, validateRequest } from "@common/utils/httpHandlers";
import { taskService } from "@modules/task/taskService";
import { ProjectRepository } from "@modules/project/projectRepository";
import { RelationRepository } from "@modules/relation/relationRepository";
import { CreateTaskSchema, UpdateTaskSchema, DeleteTaskSchema, UpdateEndDateSchema, UpdateStartDateSchema , UpdateDatesSchema } from "@modules/task/taskModel";
import { authenticateJWT } from "@common/middleware/authMiddleware";
import rolegrop4 from "@common/middleware/roleGroup4";
import rolegrop5 from "@common/middleware/roleGroup5";

export const taskRouter = (() => {
    const router = express.Router();

    // GET all tasks
    router.get("/get",
        authenticateJWT,
        rolegrop4,
        rolegrop5,
        async (req: Request, res: Response): Promise<void> => {
            const ServiceResponse = await taskService.findAll();
            handleServiceResponse(ServiceResponse, res);
        });

    // เพิ่ม endpoint สำหรับดึง Task ตาม Project ID
    router.get("/getbyproject/:project_id",
        authenticateJWT,
        rolegrop5,
        async (req: Request, res: Response): Promise<void> => {
            const { project_id } = req.params;
            const ServiceResponse = await taskService.findByProjectId(project_id);
            handleServiceResponse(ServiceResponse, res);
            return;
        });

    // CREATE a task
    // router.post("/create",
    //     authenticateJWT,
    //     rolegrop5,
    //     validateRequest(CreateTaskSchema), async (req: Request, res: Response) => {
    //         const payload = req.body;
    //         payload.created_by = req.user.userId; // Set created_by from the authenticated user
    //         payload.updated_by = req.user.userId; // Set updated_by from the authenticated user
    //         const ServiceResponse = await taskService.create(payload);
    //         handleServiceResponse(ServiceResponse, res);
    //     });

    // router.post("/create",
    //     authenticateJWT,
    //     rolegrop5,
    //     validateRequest(CreateTaskSchema),
    //     async (req: Request, res: Response): Promise<void> => {
    //         const payload = req.body;
    //         const userId = req.user.userId;
    //         const userRole = req.user.role;

    //         // ตรวจสอบว่ามี project_id หรือไม่
    //         if (!payload.project_id) {
    //             res.status(400).json({
    //                 success: false,
    //                 message: "Project ID is required",
    //                 responseObject: null
    //             });
    //             return;
    //         }

    //         // ถ้าเป็น Manager ต้องตรวจสอบว่าเป็นเจ้าของ Project หรือไม่
    //         if (userRole === "Manager") {
    //             try {
    //                 // ดึงข้อมูล Project
    //                 const project = await ProjectRepository.findById(payload.project_id);

    //                 // ตรวจสอบว่า Project มีอยู่จริงหรือไม่
    //                 if (!project) {
    //                     res.status(404).json({
    //                         success: false,
    //                         message: "Project not found",
    //                         responseObject: null
    //                     });
    //                     return;
    //                 }

    //                 // ตรวจสอบว่า Manager เป็นเจ้าของ Project หรือไม่
    //                 if (project.created_by !== userId) {
    //                     res.status(403).json({
    //                         success: false,
    //                         message: "You don't have permission to create tasks in this project",
    //                         responseObject: null
    //                     });
    //                     return;
    //                 }
    //             } catch (error) {
    //                 console.error("Error checking project ownership:", error);
    //                 res.status(500).json({
    //                     success: false,
    //                     message: "Error checking project ownership",
    //                     responseObject: null
    //                 });
    //                 return;
    //             }
    //         }

    //         // เพิ่มข้อมูลผู้สร้างและผู้อัปเดต
    //         payload.created_by = userId;
    //         payload.updated_by = userId;

    //         // ส่งไปที่ Service
    //         const ServiceResponse = await taskService.create(payload);
    //         handleServiceResponse(ServiceResponse, res);
    //     }
    // );

    router.post("/create",
        authenticateJWT,
        rolegrop5,
        validateRequest(CreateTaskSchema),
        async (req: Request, res: Response): Promise<void> => {
            const payload = req.body;
            const userId = req.user.userId;
            const userRole = req.user.role;

            // ตรวจสอบว่ามี project_id หรือไม่
            if (!payload.project_id) {
                res.status(400).json({
                    success: false,
                    message: "Project ID is required",
                    responseObject: null
                });
                return;
            }

            // ถ้าเป็น Manager ต้องตรวจสอบว่าเป็นเจ้าของ Project หรือมีความสัมพันธ์กับ Project หรือไม่
            if (userRole === "Manager") {
                try {
                    // ดึงข้อมูล Project
                    const project = await ProjectRepository.findById(payload.project_id);

                    // ตรวจสอบว่า Project มีอยู่จริงหรือไม่
                    if (!project) {
                        res.status(404).json({
                            success: false,
                            message: "Project not found",
                            responseObject: null
                        });
                        return;
                    }

                    // ตรวจสอบว่า Manager เป็นเจ้าของ Project หรือไม่
                    const isOwner = project.created_by === userId;

                    if (!isOwner) {
                        // ถ้าไม่ใช่เจ้าของ ให้ตรวจสอบความสัมพันธ์จากตาราง Relation
                        const relation = await RelationRepository.findByProjectAndUser(
                            payload.project_id,
                            userId
                        );

                        // ถ้าไม่มีความสัมพันธ์กับโปรเจค
                        if (!relation) {
                            res.status(403).json({
                                success: false,
                                message: "You don't have permission to create tasks in this project",
                                responseObject: null
                            });
                            return;
                        }
                    }
                } catch (error) {
                    console.error("Error checking project permissions:", error);
                    res.status(500).json({
                        success: false,
                        message: "Error checking project permissions",
                        responseObject: null
                    });
                    return;
                }
            }

            // เพิ่มข้อมูลผู้สร้างและผู้อัปเดต
            payload.created_by = userId;
            payload.updated_by = userId;

            // ส่งไปที่ Service
            const ServiceResponse = await taskService.create(payload);
            handleServiceResponse(ServiceResponse, res);
        }
    );

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

    // UPDATE both dates together
    router.put("/updatedates",
        authenticateJWT,
        rolegrop5,
        validateRequest(UpdateDatesSchema), async (req: Request, res: Response) => {
            const { task_id, start_date, end_date } = req.body;
            const payload = {
                start_date,
                end_date,
                updated_by: req.user.userId, // Set updated_by from the authenticated user
            };
            const ServiceResponse = await taskService.updateDates(task_id, payload);
            handleServiceResponse(ServiceResponse, res);
        });


    router.get(
        "/project/:projectId",
        authenticateJWT,
        async (req: Request, res: Response) => {
            const { projectId } = req.params;
            const serviceResponse = await taskService.findByProjectId(projectId);
            handleServiceResponse(serviceResponse, res);
        }
    );

    return router;
})();