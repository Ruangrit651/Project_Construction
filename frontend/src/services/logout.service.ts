import { LOGOUT } from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { LogoutResponse } from "@/types/response/response.logout";
import { playlodeLogout } from "@/types/requests/request.logout";

export const logoutUser = async (): Promise<LogoutResponse> => {
    const { data: response } = await mainApi.post<LogoutResponse>(LOGOUT, null, {
        withCredentials: true,
    });
    return response;
};