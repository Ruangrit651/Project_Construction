import prisma from "@src/db";
import { TypePayloadDashboard } from "@modules/dashboard/dashboardModel";
import { differenceInDays } from "date-fns";

export const DashboardRepository = {
  findAllAsync: async () => {
    const projects = await prisma.project.findMany({
      select: {
        project_id: true,
        project_name: true,
        budget: true, // Total Budget
        actual: true, // Amount Spent
        start_date: true,
        end_date: true,
        status: true,
      },
    });

    const currentDate = new Date();

    return projects.map((project) => {
      if (!project.start_date || !project.end_date) {
        return {
          ...project,
          projectDuration: null,
          utilizedDuration: null,
          percentTarget: null,
          variation: null,
          amountSpent: project.actual || 0, // ใช้ actual เป็น Amount Spent
          totalBudget: project.budget || 0, // ใช้ budget เป็น Total Budget
        };
      }

      const startDate = new Date(project.start_date);
      const endDate = new Date(project.end_date);

      const projectDuration = differenceInDays(endDate, startDate);
      const utilizedDuration = differenceInDays(currentDate, startDate);
      const percentTarget = Math.min((utilizedDuration / projectDuration) * 100, 100);
      const expectedProgress = percentTarget;
      const variation = utilizedDuration - (projectDuration * expectedProgress) / 100;

      return {
        ...project,
        projectDuration,
        utilizedDuration,
        percentTarget,
        variation,
        amountSpent: project.actual || 0, // ใช้ actual เป็น Amount Spent
        totalBudget: project.budget || 0, // ใช้ budget เป็น Total Budget
      };
    });
},

// ดึงข้อมูล Dashboard ตาม project_id
findById: async (project_id: string) => {
    return prisma.project.findUnique({
      where: { project_id },
      select: {
        project_id: true,
        project_name: true,
        budget: true,
        actual: true,
        start_date: true,
        end_date: true,
        status: true,
      },
    });
  },

  
};
