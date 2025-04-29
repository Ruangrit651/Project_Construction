export type PayloadCreateProgress = {
    task_id?: string;
    subtask_id?: string;
    percent: number;
    description?: string;
    date_recorded?: string;
  };
  
  export type PayloadUpdateProgress = {
    progress_id: string;
    percent?: number;
    description?: string;
    date_recorded?: string;
  };
  
  export type PayloadDeleteProgress = {
    progress_id: string;
  };