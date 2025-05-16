export type PayloadCreateTask = {
    project_id: string; // ID ของ Project ที่ Task นี้เกี่ยวข้อง
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: string;
};

export type PayloadUpdateTask = {
    task_id: string; 
    task_name?: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: string;
}

export type PayloadUpdateStartDate = {
    task_id: string;
    start_date?: string;
}

export type PayloadUpdateEndDate = {
    task_id: string;
    end_date?: string;
}

export type PayloadUpdateDates = {
    task_id: string;
    start_date: string;
    end_date: string;
}

export type PayloadDeleteTask = {
    task_id : string;
}