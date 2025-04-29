import { StatusCodes } from "http-status-codes";
import { ResponseStatus, ServiceResponse } from "@common/models/serviceResponse";
import { DashboardRepository } from "@modules/dashboard/dashboardReository";
import axios from "axios";

export const dashboardService = {
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

export const getCostBreakdownData = async () => {
    const response = await axios.get("/api/cost-breakdown"); // แก้ไข URL ให้ตรงกับ API จริง
    return response.data; // สมมติว่า API ส่งข้อมูลในรูปแบบ { series: [44, 55, 41, 17, 15] }
  };