import { CREATE_RESOURCE, GET_RESOURCE_ALL , UPDATE_RESOURCE ,DELETE_RESOURCE} from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateResource , PayloadDeleteResource ,PayloadUpdateResource} from "@/types/requests/request.resource";
import { ResourceResponse } from "@/types/response/response.resource";

export const getResource = async () => {
    const { data: response} = await mainApi.get(
        GET_RESOURCE_ALL
    );
    return response;
};

export const postResource = async (data: PayloadCreateResource) => {
    const { data: response } = await mainApi.post<ResourceResponse>(
        CREATE_RESOURCE,
        data
    );
    return response;
}

export const patchResource = async (data: PayloadUpdateResource) => {
    const { data: response } = await mainApi.put<ResourceResponse>(
        UPDATE_RESOURCE,
        data
    );
    return response;
}


export const deleteResource = async (data: PayloadDeleteResource) => {
    const { data: response } = await mainApi.delete<ResourceResponse>(
        DELETE_RESOURCE + "/" + data.resource_id
    );
    return response;
}
