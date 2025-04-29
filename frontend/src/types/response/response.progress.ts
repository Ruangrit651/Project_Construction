export type TypeProgress = {
    progress_id: string;
    task_id?: string;
    subtask_id?: string;
    percent: number;
    description?: string;
    date_recorded: string;
    created_at: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
  };
  
  export type ProgressResponse = {
    success: boolean;
    message: string;
    responseObject: TypeProgress;
    statusCode: number;
  };
  
  export type TypeProgressAllResponse = {
    success: boolean;
    message: string;
    responseObject: TypeProgress[];
    statusCode: number;
  };