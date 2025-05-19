import { TypeDashboard } from "@/types/response/response.dashboard";

export const calculateTotalDuration = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const totalDays = projects.reduce((sum, project) => {
    if (!project.start_date || !project.end_date) return sum;
    
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    const duration = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    return sum + duration;
  }, 0);

  return totalDays;
};