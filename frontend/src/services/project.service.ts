import { CREATE_PROJECT, GET_PROJECT_ALL , UPDATE_PROJECT ,DELETE_PROJECT} from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateProject , PayloadDeleteProject ,PayloadUpdateProject} from "@/types/requests/request.project";
import { ProjectResponse } from "@/types/response/response.project";

export const getProject = async () => {
    const { data: response} = await mainApi.get(
        GET_PROJECT_ALL
    );
    return response;
};

export const postProject = async (data: PayloadCreateProject) => {
    const { data: response } = await mainApi.post<ProjectResponse>(
        CREATE_PROJECT,
        data
    );
    return response;
}

export const patchProject = async (data: PayloadUpdateProject) => {
    const { data: response } = await mainApi.put<ProjectResponse>(
        UPDATE_PROJECT,
        data
    );
    return response;
}


export const deleteProject = async (data: PayloadDeleteProject) => {
    const { data: response } = await mainApi.delete<ProjectResponse>(
        DELETE_PROJECT + "/" + data.project_id
    );
    return response;
}
