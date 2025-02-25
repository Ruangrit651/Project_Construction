import { CREATE_ROLE, GET_ROLE_ALL , UPDATE_ROLE ,DELETE_ROLE} from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateRole , PayloadDeleteRole ,PayloadUpdateRole} from "@/types/requests/request.role";
import { RoleResponse } from "@/types/response/response.role";

  
  export const getRole = async () => {
    const { data: response} = await mainApi.get(
        GET_ROLE_ALL
    );
    return response;
};

export const postRole = async (data: PayloadCreateRole) => {
  const { data: response } = await mainApi.post<RoleResponse>(
      CREATE_ROLE,
      data
  );
  return response;
}

export const patchRole = async (data: PayloadUpdateRole) => {
  const { data: response } = await mainApi.put<RoleResponse>(
      UPDATE_ROLE,
      data
  );
  return response;
}


export const deleteRole = async (data: PayloadDeleteRole) => {
  const { data: response } = await mainApi.delete<RoleResponse>(
      DELETE_ROLE + "/" + data.role_id
  );
  return response;
}