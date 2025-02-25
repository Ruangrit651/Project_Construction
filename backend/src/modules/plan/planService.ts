import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { PlanRepository } from "@modules/plan/planRepository"; // สร้างและอ้างอิง PlanRepository
import { TypePayloadPlan } from "@modules/plan/planModel"; // อ้างอิงจาก planModel
import { plan } from "@prisma/client"; // อ้างอิงจาก Prisma Client

export const planService = {
    // อ่านข้อมูล plan ทั้งหมด
    findAll: async () => {
        const plans = await PlanRepository.findAllAsync();
        return new ServiceResponse(
            ResponseStatus.Success, 
            "Get all plans success",
            plans,
            StatusCodes.OK
        );
    },

    // สร้าง plan ใหม่
    create: async (payload: TypePayloadPlan) => {
        try {
            const newPlan = await PlanRepository.create(payload);
            return new ServiceResponse<plan>(
                ResponseStatus.Success,
                "Create plan success",
                newPlan,
                StatusCodes.CREATED
            );
        } catch (ex) {
            const errorMessage = "Error creating plan: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดต plan
    update: async (plan_id: string, payload: Partial<TypePayloadPlan>) => {
        try {
            // ตรวจสอบว่า plan มีอยู่จริง
            const existingPlan = await PlanRepository.findById(plan_id);
            if (!existingPlan) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found plan",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            const updatedPlan = await PlanRepository.update(plan_id, payload);
            return new ServiceResponse<plan>(
                ResponseStatus.Success,
                "Update plan success",
                updatedPlan,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating plan: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ลบ plan
    delete: async (plan_id: string) => {
        try {
            // ตรวจสอบว่า plan มีอยู่จริง
            const existingPlan = await PlanRepository.findById(plan_id);
            if (!existingPlan) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Not found plan",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            await PlanRepository.delete(plan_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Delete plan success",
                null,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error deleting plan: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
};
