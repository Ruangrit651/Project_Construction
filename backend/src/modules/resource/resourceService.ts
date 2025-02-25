import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { ResourceRepository } from "@modules/resource/resourceRepository";
import { TypePayloadResource } from "@modules/resource/resourceModel";
import { resource } from "@prisma/client";

export const resourceService = {
    // อ่านข้อมูลทรัพยากรทั้งหมด
    findAll: async () => {
        const resources = await ResourceRepository.findAllAsync();
        return new ServiceResponse(
            ResponseStatus.Success,
            "Get all resources success",
            resources,
            StatusCodes.OK
        );
    },

    // สร้างทรัพยากรใหม่
    create: async (payload: TypePayloadResource) => {
        try {
            const resource = await ResourceRepository.create(payload);
            return new ServiceResponse<resource>(
                ResponseStatus.Success,
                "Create resource success",
                resource,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error creating resource: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดตทรัพยากร
    update: async (resource_id: string, payload: Partial<TypePayloadResource>) => {
        try {
            const existingResource = await ResourceRepository.findById(resource_id);
            if (!existingResource) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Resource not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            const updatedResource = await ResourceRepository.update(resource_id, payload);
            return new ServiceResponse<resource>(
                ResponseStatus.Success,
                "Update resource success",
                updatedResource,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating resource: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ลบทรัพยากร
    delete: async (resource_id: string) => {
        try {
            const existingResource = await ResourceRepository.findById(resource_id);
            if (!existingResource) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Resource not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            await ResourceRepository.delete(resource_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Delete resource success",
                null,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error deleting resource: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
};