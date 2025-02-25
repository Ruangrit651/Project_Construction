import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { RoleRepository } from "@modules/role/roleRepository";
import { TypePayloadRole } from "@modules/role/roleModel";
import { role } from "@prisma/client";

export const roleService = {
    // อ่านข้อมูล Roles ทั้งหมด
    findAll: async () => {
        const roles = await RoleRepository.findAllAsync();
        return new ServiceResponse(
            ResponseStatus.Success,
            "Get all roles success",
            roles,
            StatusCodes.OK
        );
    },

    // สร้าง Role ใหม่
    create: async (payload: TypePayloadRole) => {
        try {
            const checkRole = await RoleRepository.findByName(payload.name);
            if (checkRole) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Role name already exists",
                    null,
                    StatusCodes.BAD_REQUEST
                );
            }
            const role = await RoleRepository.create(payload);
            return new ServiceResponse<role>(
                ResponseStatus.Success,
                "Create role success",
                role,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error creating role: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // อัปเดต Role
    update: async (role_id: string, payload: Partial<TypePayloadRole>) => {
        try {
            const existingRole = await RoleRepository.findById(role_id);
            if (!existingRole) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Role not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            const updatedRole = await RoleRepository.update(role_id, payload);
            return new ServiceResponse<role>(
                ResponseStatus.Success,
                "Update role success",
                updatedRole,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error updating role: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ลบ Role
    delete: async (role_id: string) => {
        try {
            const existingRole = await RoleRepository.findById(role_id);
            if (!existingRole) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Role not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            await RoleRepository.delete(role_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Delete role success",
                null,
                StatusCodes.OK
            );
        } catch (ex) {
            const errorMessage = "Error deleting role: " + (ex as Error).message;
            return new ServiceResponse(
                ResponseStatus.Failed,
                errorMessage,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
};
