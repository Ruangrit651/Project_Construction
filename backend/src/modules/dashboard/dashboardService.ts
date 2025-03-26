import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { DashboardRepository } from "@modules/dashboard/dashboardReository";

export const dashboardService = {
    // ดึงข้อมูล Dashboard ทั้งหมด
    findAll: async () => {
        const dashboardData = await DashboardRepository.findAllAsync();
        return new ServiceResponse(
            ResponseStatus.Success,
            "Get all dashboard data success",
            dashboardData,
            StatusCodes.OK
        );
    },

    // ดึงข้อมูล Dashboard ตาม project_id
    findById: async (project_id: string) => {
        const dashboardData = await DashboardRepository.findById(project_id);
        if (!dashboardData) {
            return new ServiceResponse(
                ResponseStatus.Failed,
                "Dashboard data not found",
                null,
                StatusCodes.NOT_FOUND
            );
        }
        return new ServiceResponse(
            ResponseStatus.Success,
            "Get dashboard data success",
            dashboardData,
            StatusCodes.OK
        );
    },
};