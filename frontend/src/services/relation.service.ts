import {GET_ALL_RELATIONS,GET_PROJECT_RELATIONS,GET_USER_RELATIONS,CREATE_RELATION,DELETE_RELATION,DELETE_RELATION_BY_PROJECT_USER,
  } from "@/apis/endpoint.api";
  import mainApi from "@/apis/main.api";
  import { PayloadCreateRelation, PayloadDeleteRelation, PayloadDeleteRelationByProjectUser 
  } from "@/types/requests/request.relation";
  import { RelationResponse } from "@/types/response/response.relation";
  
  // ดึงข้อมูล relations ทั้งหมด
  export const getAllRelations = async () => {
    const { data: response } = await mainApi.get(GET_ALL_RELATIONS);
    return response;
  };
  
  // ดึงข้อมูล users ใน project
  export const getProjectUsers = async (projectId: string) => {
    const { data: response } = await mainApi.get(`${GET_PROJECT_RELATIONS}/${projectId}`);
    return response;
  };
  
  // ดึงข้อมูล projects ของ user
  export const getUserProjects = async (userId: string) => {
    const { data: response } = await mainApi.get(`${GET_USER_RELATIONS}/${userId}`);
    return response;
  };
  
  // สร้าง relation ใหม่ (เพิ่ม user เข้า project)
export const createRelation = async (data: PayloadCreateRelation) => {
    const { data: response } = await mainApi.post<RelationResponse>(
      CREATE_RELATION,
      data
    );
    return response;
  };
  
  // ลบ relation ตาม ID
  export const deleteRelation = async (relationId: string) => {
    const { data: response } = await mainApi.delete<RelationResponse>(
      `${DELETE_RELATION}/${relationId}`
    );
    return response;
  };
  
  // ลบ relation ตาม project_id และ user_id
  export const deleteRelationByProjectUser = async (data: PayloadDeleteRelationByProjectUser) => {
    const { data: response } = await mainApi.delete<RelationResponse>(
      DELETE_RELATION_BY_PROJECT_USER,
      { data }
    );
    return response;
  };