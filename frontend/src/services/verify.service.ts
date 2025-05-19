import { VERIFY } from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { LoginResponse } from "@/types/response/response.login";

export const verifyUser = async (): Promise<LoginResponse> => {
  const { data: response } = await mainApi.get<LoginResponse>(VERIFY, {
    withCredentials: true, // เพื่อให้ Cookie ถูกส่งไปด้วย
  });
  return response;
};