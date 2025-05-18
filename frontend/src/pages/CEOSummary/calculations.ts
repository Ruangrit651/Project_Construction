import { TypeDashboard } from "@/types/response/response.dashboard";

export const calculateEAC = (projects: TypeDashboard[] | null) => {
  if (!projects || projects.length === 0) return null;
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0);

  // ใช้ actual แทน amountSpent หรือให้แน่ใจว่า amountSpent ถูกอัพเดตจาก actual
  const totalAmountSpent = projects.reduce((sum, project) =>
    sum + Number(project.actual || project.amountSpent || 0), 0);

  const totalProgress = projects.reduce((sum, project) => sum + (project.completionRate || 0), 0) / projects.length;
  const earnedValue = (totalProgress / 100) * totalBudget;
  return totalAmountSpent + (totalBudget - earnedValue);
};

export const calculateCompletionRate = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;
  const totalCompletion = projects.reduce((sum, project) => sum + (project.completionRate || 0), 0);
  return (totalCompletion / projects.length) * 100;
};

export const calculateUtilizedDuration = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;
  const today = new Date();
  return projects.reduce((sum, project) => {
    const startDate = new Date(project.start_date);
    return sum + Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  }, 0);
};