import {
  CREATE_TASK, GET_TASK_ALL, UPDATE_TASK, DELETE_TASK,
  UPDATE_START_DATE_TASK, UPDATE_END_DATE_TASK,
  UPDATE_DATES_TASK, GET_TASK_PROJECT
} from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import { PayloadCreateTask, PayloadDeleteTask, PayloadUpdateTask, PayloadUpdateStartDate, PayloadUpdateEndDate,PayloadUpdateDates } from "@/types/requests/request.task";
import { TaskResponse } from "@/types/response/response.task";


export const getTask = async () => {
  const { data: response } = await mainApi.get(
    GET_TASK_ALL
  );
  return response;
};

export const postTask = async (data: PayloadCreateTask) => {
  const { data: response } = await mainApi.post<TaskResponse>(
    CREATE_TASK,
    data
  );
  return response;
}

export const patchTask = async (data: PayloadUpdateTask) => {
  const { data: response } = await mainApi.put<TaskResponse>(
    UPDATE_TASK,
    data
  );
  return response;
}

export const updateStartDateTask = async (data: PayloadUpdateStartDate) => {
  const { data: response } = await mainApi.put<TaskResponse>(
    UPDATE_START_DATE_TASK,
    data
  );
  return response;
}

export const updateEndDateTask = async (data: PayloadUpdateEndDate) => {
  const { data: response } = await mainApi.put<TaskResponse>(
    UPDATE_END_DATE_TASK,
    data
  );
  return response;
}

export const updateTaskDates = async (data: PayloadUpdateDates) => {
  const { data: response } = await mainApi.put<TaskResponse>(
    UPDATE_DATES_TASK,
    data
  );
  return response;
}


export const deleteTask = async (data: PayloadDeleteTask) => {
  const { data: response } = await mainApi.delete<TaskResponse>(
    DELETE_TASK + "/" + data.task_id
  );
  return response;

}

export const getTaskProject = async (projectId: string) => {
  const { data: response } = await mainApi.get<TaskResponse>(
    GET_TASK_PROJECT + "/" + projectId
  );
  return response;
}