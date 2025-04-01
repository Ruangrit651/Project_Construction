export type TypeDashboardAll = {
    project_id: string;
    project_name: string;
    actual: number;
    budget: number;
    status: boolean;
    start_date: string;
    end_date: string;
  };
  
  export type TypeDashboard = {
    project_id: string;
    project_name: string;
    actual: number;
    budget: number;
    status: string;
    start_date: string;
    end_date: string;
  };
  
  export type DashboardResponse = {
    success: boolean;
    message: string;
    responseObject: TypeDashboard[]; 
    statusCode: number;
  };