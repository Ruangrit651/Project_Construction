import { StatusCodes } from "http-status-codes";
import {
  ResponseStatus,
  ServiceResponse,
} from "@common/models/serviceResponse";
import { ResourceRepository } from "@modules/resource/resourceRepository";
import { TypePayloadResource } from "@modules/resource/resourceModel";
import { projectService } from "@modules/project/projectService";
import { resource } from "@prisma/client";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  summaryByType: async (project_ids?: string[]) => {
    const summary = await ResourceRepository.summaryByType(project_ids);
    console.log("summary", summary);
    return {
      success: true,
      message: "Resource summary retrieved successfully",
      statusCode: 200,
      responseObject: summary.map((item) => ({
        type: item.resource_type,
        quantity: Number(item._sum.quantity) || 0,
        totalCost: Number(item._sum.total) || 0,
      })),
      //   responseObject: summary,
    };
  },

  // สร้างทรัพยากรใหม่
  // สร้างทรัพยากรใหม่
  create: async (payload: TypePayloadResource) => {
    try {
      const resource = await ResourceRepository.create(payload);

      // ดึงข้อมูล task เพื่อหา project_id
      const task = await prisma.task.findUnique({
        where: {
          task_id: payload.task_id || undefined
        },
        select: { project_id: true }
      });

      // อัปเดตค่า Actual ในโปรเจค
      if (task && task.project_id) {
        await projectService.updateActualCost(task.project_id);
      }

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
  update: async (
    resource_id: string,
    payload: Partial<TypePayloadResource>
  ) => {
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

      const updatedResource = await ResourceRepository.update(
        resource_id,
        payload
      );

      // ดึงข้อมูล task เพื่อหา project_id
      const task = await prisma.task.findUnique({
        where: {
          task_id: existingResource.task_id || undefined
        },
        select: { project_id: true }
      });

      // อัปเดตค่า Actual ในโปรเจค
      if (task && task.project_id) {
        await projectService.updateActualCost(task.project_id);
      }

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

      // ดึงข้อมูล task เพื่อหา project_id ก่อนลบทรัพยากร
      const task = await prisma.task.findUnique({
        where: {
          task_id: existingResource.task_id || undefined
        },
        select: { project_id: true }
      });

      const projectId = task?.project_id;

      await ResourceRepository.delete(resource_id);

      // อัปเดตค่า Actual ในโปรเจคหลังจากลบทรัพยากร
      if (projectId) {
        await projectService.updateActualCost(projectId);
      }

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
