export type TypeDashboardAll = {
    project_id: string;
    project_name: string;
    actual: number;
    budget: number;
    status: boolean;
    start_date: string;
    end_date: string;
    percentTarget: number;
    variation: number;
  };
  
  export type TypeDashboard = {
    project_id: string;
    project_name: string;
    actual: number;
    budget: number;
    status: string;
    start_date: string;
    end_date: string;
    percentTarget: number;
    variation: number;
    totalBudget: number;
    amountSpent: number;
    completionRate?: number; // อัตราการทำงานของโปรเจ็กต์ (0-100)
  };
  
  export type DashboardResponse = {
    success: boolean;
    message: string;
    responseObject: TypeDashboard[]; 
    statusCode: number;
  };

  
  