import {
  CREATE_SUBTASK, GET_SUBTASK_ALL, UPDATE_SUBTASK, DELETE_SUBTASK,
  UPDATE_START_DATE_SUBTASK, UPDATE_END_DATE_SUBTASK, UPDATE_DATES_SUBTASK
} from "@/apis/endpoint.api";
import mainApi from "@/apis/main.api";
import {
  PayloadCreateSubtask, PayloadDeleteSubtask, PayloadUpdateSubtask,
  PayloadUpdateSubtaskStartDate, PayloadUpdateSubtaskEndDate, PayloadUpdateSubtaskDates
} from "@/types/requests/request.subtask";
import { SubtaskResponse } from "@/types/response/response.subtask";

export const getSubtask = async () => {
  const { data: response } = await mainApi.get(
    GET_SUBTASK_ALL
  );
  return response;
};

export const postSubtask = async (data: PayloadCreateSubtask) => {
  const { data: response } = await mainApi.post<SubtaskResponse>(
    CREATE_SUBTASK,
    data
  );
  return response;
};

export const patchSubtask = async (data: PayloadUpdateSubtask) => {
  const { data: response } = await mainApi.put<SubtaskResponse>(
    UPDATE_SUBTASK,
    data
  );
  return response;
};

export const updateStartDateSubtask = async (data: PayloadUpdateSubtaskStartDate) => {
  const { data: response } = await mainApi.put<SubtaskResponse>(
    UPDATE_START_DATE_SUBTASK,
    data
  );
  return response;
};

export const updateEndDateSubtask = async (data: PayloadUpdateSubtaskEndDate) => {
  const { data: response } = await mainApi.put<SubtaskResponse>(
    UPDATE_END_DATE_SUBTASK,
    data
  );
  return response;
};

export const updateSubtaskDates = async (data: PayloadUpdateSubtaskDates) => {
  const { data: response } = await mainApi.put<SubtaskResponse>(
    UPDATE_DATES_SUBTASK,
    data
  );
  return response;
};

export const deleteSubtask = async (data: PayloadDeleteSubtask) => {
  const { data: response } = await mainApi.delete<SubtaskResponse>(
    DELETE_SUBTASK + "/" + data.subtask_id
  );
  return response;
};

