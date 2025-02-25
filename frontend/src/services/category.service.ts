import { CREATE_CATEGORY, GET_CATEGORY_ALL , UPDATE_CATEGORY ,DELETE_CATEGORY} from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateCategory , PayloadDeleteCategory ,PayloadUpdateCategory} from "@/types/requests/request.category";
import { CategoryResponse } from "@/types/response/response.category";

export const getCategories = async () => {
    const { data: response} = await mainApi.get(
        GET_CATEGORY_ALL
    );
    return response;
};

export const postCategory = async (data: PayloadCreateCategory) => {
    const { data: response } = await mainApi.post<CategoryResponse>(
        CREATE_CATEGORY,
        data
    );
    return response;
}

export const patchCategory = async (data: PayloadUpdateCategory) => {
    const { data: response } = await mainApi.patch<CategoryResponse>(
        UPDATE_CATEGORY,
        data
    );
    return response;
}

export const deleteCategory = async (data: PayloadDeleteCategory) => {
    const { data: response } = await mainApi.delete<CategoryResponse>(
        DELETE_CATEGORY + "/" + data.id
    );
    return response;
}