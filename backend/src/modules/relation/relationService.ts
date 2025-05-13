import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { RelationRepository } from "@modules/relation/relationRepository";
import { UserRepository } from "@modules/user/userRepository";
import { ProjectRepository } from "@modules/project/projectRepository";
import { TypePayloadRelation } from "@modules/relation/relationModel";
import { relation } from "@prisma/client";

export const relationService = {
    // ดึงข้อมูลความสัมพันธ์ทั้งหมด
    findAll: async () => {
        const relations = await RelationRepository.findAllAsync();
        return new ServiceResponse(
            ResponseStatus.Success,
            "Get all relations success",
            relations,
            StatusCodes.OK
        );
    },

    // ดึงข้อมูลความสัมพันธ์ตาม relation_id
    findById: async (relation_id: string) => {
        try {
            const relation = await RelationRepository.findById(relation_id);
            if (!relation) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Relation not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }
            return new ServiceResponse(
                ResponseStatus.Success,
                "Get relation success",
                relation,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error finding relation: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ดึงข้อมูลความสัมพันธ์ทั้งหมดตาม project_id
    findByProjectId: async (project_id: string) => {
        try {
            // ตรวจสอบว่า project มีอยู่จริง
            const project = await ProjectRepository.findById(project_id);
            if (!project) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Project not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            const relations = await RelationRepository.findByProjectId(project_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Get project relations success",
                relations,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error finding project relations: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ดึงข้อมูลความสัมพันธ์ทั้งหมดตาม user_id
    findByUserId: async (user_id: string) => {
        try {
            // ตรวจสอบว่า user มีอยู่จริง
            const user = await UserRepository.findById(user_id);
            if (!user) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "User not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            const relations = await RelationRepository.findByUserId(user_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Get user relations success",
                relations,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error finding user relations: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // สร้างความสัมพันธ์ใหม่
    create: async (payload: TypePayloadRelation) => {
        try {
            // ตรวจสอบว่า project มีอยู่จริง
            const project = await ProjectRepository.findById(payload.project_id);
            if (!project) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Project not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบว่า user มีอยู่จริง
            const user = await UserRepository.findById(payload.user_id);
            if (!user) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "User not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            // ตรวจสอบว่าความสัมพันธ์นี้มีอยู่แล้วหรือไม่
            const existingRelation = await RelationRepository.findByProjectAndUser(
                payload.project_id,
                payload.user_id
            );
            
            if (existingRelation) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "This relation already exists",
                    null,
                    StatusCodes.BAD_REQUEST
                );
            }

            const newRelation = await RelationRepository.create(payload);
            return new ServiceResponse<relation>(
                ResponseStatus.Success,
                "Create relation success",
                newRelation,
                StatusCodes.CREATED
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error creating relation: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ลบความสัมพันธ์ตาม relation_id
    delete: async (relation_id: string) => {
        try {
            const existingRelation = await RelationRepository.findById(relation_id);
            if (!existingRelation) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Relation not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            await RelationRepository.delete(relation_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Delete relation success",
                null,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error deleting relation: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    },

    // ลบความสัมพันธ์ตาม project_id และ user_id
    deleteByProjectAndUser: async (project_id: string, user_id: string) => {
        try {
            const existingRelation = await RelationRepository.findByProjectAndUser(project_id, user_id);
            if (!existingRelation) {
                return new ServiceResponse(
                    ResponseStatus.Failed,
                    "Relation not found",
                    null,
                    StatusCodes.NOT_FOUND
                );
            }

            await RelationRepository.deleteByProjectAndUser(project_id, user_id);
            return new ServiceResponse(
                ResponseStatus.Success,
                "Delete relation success",
                null,
                StatusCodes.OK
            );
        } catch (ex) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Error deleting relation: " + (ex as Error).message,
                null,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
};