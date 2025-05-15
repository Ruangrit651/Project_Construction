import { GET_PROGRESS_ALL, CREATE_PROGRESS, UPDATE_PROGRESS, DELETE_PROGRESS, GET_SUBTASK_PROGRESS, GET_PROJECT_PROGRESS, GET_TASK_PROGRESS, GET_DETAILED_PROJECT_PROGRESS } from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateProgress, PayloadUpdateProgress, PayloadDeleteProgress } from "@/types/requests/request.progress";
import { ProgressResponse, TypeProgressAllResponse, TypeProgress } from "@/types/response/response.progress";

// ดึงข้อมูล progress ทั้งหมด
export const getProgressAll = async () => {
  const { data: response } = await mainApi.get<TypeProgressAllResponse>(GET_PROGRESS_ALL);
  return response;
};

// แก้ไขฟังก์ชันเพื่อรับ parameter
export const getProjectProgress = async (project_id: string) => {
  const { data: response } = await mainApi.get<TypeProgressAllResponse>(`${GET_PROJECT_PROGRESS}/${project_id}`);
  return response;
};

export const getDetailedProjectProgress = async (project_id: string) => {
  const { data: response } = await mainApi.get<TypeProgressAllResponse>(`${GET_DETAILED_PROJECT_PROGRESS}/${project_id}`);
  return response;
};

// แก้ไขฟังก์ชันนี้ด้วย
export const getTaskProgress = async (task_id: string) => {
  const { data: response } = await mainApi.get<TypeProgressAllResponse>(`${GET_TASK_PROGRESS}/${task_id}`);
  return response;
};

// และแก้ไขฟังก์ชันนี้
export const getSubtaskProgress = async (subtask_id: string) => {
  const { data: response } = await mainApi.get<TypeProgressAllResponse>(`${GET_SUBTASK_PROGRESS}/${subtask_id}`);
  return response;
};

// สร้าง progress ใหม่
export const createProgress = async (data: PayloadCreateProgress) => {
  const { data: response } = await mainApi.post<ProgressResponse>(CREATE_PROGRESS, data);
  return response;
};

// อัปเดต progress
export const updateProgress = async (data: PayloadUpdateProgress) => {
  const { data: response } = await mainApi.put<ProgressResponse>(UPDATE_PROGRESS, data);
  return response;
};

// ลบ progress
export const deleteProgress = async (data: PayloadDeleteProgress) => {
  const { data: response } = await mainApi.delete<ProgressResponse>(`${DELETE_PROGRESS}/${data.progress_id}`);
  return response;
};