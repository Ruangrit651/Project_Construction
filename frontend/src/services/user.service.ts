import { CREATE_USER, GET_USER_ALL , UPDATE_USER ,DELETE_USER} from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateUser , PayloadDeleteUser ,PayloadUpdateUser} from "@/types/requests/request.user";
import { UserResponse } from "@/types/response/response.user";

export const getUser = async () => {
    const { data: response} = await mainApi.get(
        GET_USER_ALL
    );
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
