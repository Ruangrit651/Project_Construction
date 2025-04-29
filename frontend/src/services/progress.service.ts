import { GET_PROGRESS_ALL, CREATE_PROGRESS, UPDATE_PROGRESS, DELETE_PROGRESS } from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateProgress, PayloadUpdateProgress, PayloadDeleteProgress } from "@/types/requests/request.progress";
import { ProgressResponse, TypeProgressAllResponse } from "@/types/response/response.progress";

// ดึงข้อมูล progress ทั้งหมด
export const getProgressAll = async () => {
  const { data: response } = await mainApi.get<TypeProgressAllResponse>(GET_PROGRESS_ALL);
  return response;
};

// ดึงข้อมูล progress ของ task
export const getTaskProgress = async (task_id: string) => {
  const { data: response } = await mainApi.get<TypeProgressAllResponse>(`/v1/progress/task/${task_id}`);
  return response;
};

// ดึงข้อมูล progress ของ subtask
export const getSubtaskProgress = async (subtask_id: string) => {
  const { data: response } = await mainApi.get<TypeProgressAllResponse>(`/v1/progress/subtask/${subtask_id}`);
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