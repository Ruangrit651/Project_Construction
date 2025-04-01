import { GET_DASHBOARD } from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { DashboardResponse } from "@/types/response/response.dashboard";

export const getDashboard = async (): Promise<DashboardResponse> => {
    try {
        const { data: response } = await mainApi.get<DashboardResponse>(GET_DASHBOARD);
        return response;
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error; // ส่งข้อผิดพลาดกลับไปให้ส่วนที่เรียกใช้งานจัดการ
    }
};