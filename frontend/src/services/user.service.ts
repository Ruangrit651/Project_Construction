import { CREATE_USER, GET_USER_ALL, UPDATE_USER, DELETE_USER, TOGGLE_USER_STATUS, GET_CURRENT_USER } from "@/apis/endpoint.api";
import { GET_USER_PROJECTS } from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateUser, PayloadDeleteUser, PayloadUpdateUser } from "@/types/requests/request.user";
import { UserResponse } from "@/types/response/response.user";
import axios from "axios";

export const getUser = async () => {
    const { data: response } = await mainApi.get(
        GET_USER_ALL
    );
    return response;
};

export const getCurrentUser = async () => {
    const { data: response } = await mainApi.get(GET_CURRENT_USER);
    return response;
};

export const postUser = async (data: PayloadCreateUser) => {
    const { data: response } = await mainApi.post<UserResponse>(
        CREATE_USER,
        data
    );
    return response;
}

export const patchUser = async (data: PayloadUpdateUser) => {
    const { data: response } = await mainApi.put<UserResponse>(
        UPDATE_USER,
        data
    );
    return response;
}


export const deleteUser = async (data: PayloadDeleteUser) => {
    const { data: response } = await mainApi.delete<UserResponse>(
        DELETE_USER + "/" + data.user_id
    );
    return response;
}

export const toggleUserStatus = async (userId: string, isActive: boolean) => {
    const { data: response } = await mainApi.patch<UserResponse>(
        `${TOGGLE_USER_STATUS}/${userId}`,
        { is_active: isActive }
    );
    return response;
}

export const getUserProjects = async (userId: string) => {
    const { data: response } = await mainApi.get(`${GET_USER_PROJECTS}/${userId}`);
    return response;
};