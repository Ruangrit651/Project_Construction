import { LOGOUT } from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { LogoutResponse } from "@/types/response/response.logout";
import { PayloadLogout } from "@/types/requests/request.logout";

export const logoutUser = async (data:PayloadLogout ): Promise<LogoutResponse> => {
    const { data: response } = await mainApi.post<LogoutResponse>(LOGOUT, data, {
        withCredentials: true,
    });
    return response;
};