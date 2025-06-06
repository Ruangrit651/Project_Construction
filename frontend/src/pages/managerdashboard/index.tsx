import React, { useState, useEffect } from "react";
import CustomSelect from "../CEOSummary/CustomSelect";
import { TypeDashboard } from "@/types/response/response.dashboard";
import { getDashboard } from "@/services/dashboard.service";
import BudgetVariance from "../CEOSummary/BudgetVariance";
import ProjectCompletionRate from "../CEOSummary/ProjectCompletionRate";
import UtilizedDuration from "../CEOSummary/UtilizedDuration";
import CostBreakdown from "../CEOSummary/CostBreakdown";
import BudgetSummaryEAC from "../CEOSummary/BudgetSummaryEAC";
import { getResourceSummary } from "@/services/resource.service";
import { useLocation } from "react-router-dom";
import { getDetailedProjectProgress } from "@/services/progress.service";
import { getProjectActualCost } from "@/services/project.service";
import { formatDate, } from '../Function/FormatDate';
import { calculateTotalDuration } from "../Function/TotalDuration";

// EAC calculation function
const calculateLocalEAC = (projects: TypeDashboard[] | null, completionRate: number) => {
  if (!projects || projects.length === 0) return null;

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0); // BAC
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.actual || project.amountSpent || 0), 0); // AC

  // Calculate EV directly using the known completion rate
  const earnedValue = (completionRate / 100) * totalBudget;

  console.log("EAC Calculation Details:", {
    BAC: totalBudget,
    AC: totalAmountSpent,
    EV: earnedValue,
    formula: "EAC = AC + (BAC - EV)"
  });

  const eac = totalAmountSpent + (totalBudget - earnedValue);
  return eac;
};

// Calculate percentage of budget spent
const calculatePercentOfTarget = (projects: TypeDashboard[] | null) => {
  if (!projects || projects.length === 0) {
    return { percent: 0, isOverBudget: false, overBudgetPercent: 0 };
  }

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0);
  // ใช้ actual แทน amountSpent
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.actual || project.amountSpent || 0), 0);

  const percent = totalBudget > 0 ? (totalAmountSpent / totalBudget) * 100 : 0;
  const isOverBudget = totalAmountSpent > totalBudget;
  const overBudgetPercent = isOverBudget ? ((totalAmountSpent - totalBudget) / totalBudget) * 100 : 0;

  return { percent, isOverBudget, overBudgetPercent };
};

// Calculate total amount spent
const calculateTotalAmountSpent = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;
  // ใช้ actual แทน amountSpent
  return projects.reduce((sum, project) => sum + Number(project.actual || project.amountSpent || 0), 0);
};

// Calculate budget variance
const calculateBudgetVariance = (projects: TypeDashboard[] | null) => {
  if (!projects || projects.length === 0) {
    return { variance: 0, variancePercentage: 0 };
  }

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0);
  // ใช้ actual แทน amountSpent
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.actual || project.amountSpent || 0), 0);

  const variance = totalBudget - totalAmountSpent;
  const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

  return { variance, variancePercentage };
};

// Calculate aggregated values
const calculateAggregatedValues = (projects: TypeDashboard[]) => {
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget), 0);
  // ใช้ actual แทน amountSpent
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.actual || project.amountSpent), 0);
  const percentTarget = totalBudget > 0 ? (totalAmountSpent / totalBudget) * 100 : 0;

  return { totalBudget, totalAmountSpent, percentTarget };
};

// Calculate average completion rate
const calculateCompletionRate = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const totalCompletion = projects.reduce((sum, project) => sum + (project.completionRate || 0), 0);
  return projects.length > 0 ? totalCompletion / projects.length : 0;
};

// Calculate utilized days
const calculateUtilizedDuration = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const today = new Date();
  const totalDays = projects.reduce((sum, project) => {
    const startDate = new Date(project.start_date);
    const duration = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    return sum + duration;
  }, 0);

  return totalDays;
};


export default function ManagerDashboard() {
  const location = useLocation();
  const [projectDetails, setProjectDetails] = useState<TypeDashboard[] | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<TypeDashboard[] | null>(null);
  const [projectOptions, setProjectOptions] = useState<string[]>(["All"]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(["All"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showAsPercent, setShowAsPercent] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [resourceSummary, setResourceSummary] = useState<{ type: string; quantity: number; totalCost: number }[]>([]);
  const [currentProject, setCurrentProject] = useState<TypeDashboard | null>(null);
  const [projectProgressMap, setProjectProgressMap] = useState<Record<string, number>>({});
  // เพิ่ม state เก็บค่า Actual ที่คำนวณจากทรัพยากร
  const [calculatedActuals, setCalculatedActuals] = useState<Record<string, number>>({});
  const totalDays = filteredProjects ? calculateTotalDuration(filteredProjects) : 0;

  // Get project ID from URL if available
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get('project_id');
  const projectName = searchParams.get('project_name');

  // Calculate metrics based on filtered projects
  const aggregatedValues = filteredProjects ? calculateAggregatedValues(filteredProjects) : null;
  const completionRate = filteredProjects ?
    filteredProjects.reduce((sum, project) => {
      // ใช้ progress จาก API ถ้ามี หรือใช้ค่าจาก project.completionRate
      const projectProgress = projectProgressMap[project.project_id] || project.completionRate || 0;
      return sum + projectProgress;
    }, 0) / (filteredProjects.length || 1) : 0;
  const totalAmountSpent = filteredProjects ? calculateTotalAmountSpent(filteredProjects) : 0;
  const utilizedDays = filteredProjects ? calculateUtilizedDuration(filteredProjects) : 0;
  const actualBudget = filteredProjects
    ? filteredProjects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0)
    : 0;
  const estimatedEAC = calculateLocalEAC(filteredProjects, completionRate) || 0;
  const { percent, isOverBudget, overBudgetPercent } = calculatePercentOfTarget(filteredProjects);

  // เพิ่ม function สำหรับดึงข้อมูล progress
  const fetchProjectProgress = async (projectId: string) => {
    try {
      const progressData = await getDetailedProjectProgress(projectId);
      if (progressData.success) {
        return progressData.responseObject.projectProgress || 0;
      }
      return 0;
    } catch (error) {
      console.error(`Error fetching progress for project ${projectId}:`, error);
      return 0;
    }
  };

  // Fetch project data
  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        const data = await getDashboard();
        if (Array.isArray(data.responseObject) && data.responseObject.length > 0) {

          // ดึงค่า Actual Cost ที่คำนวณจากทรัพยากรสำหรับแต่ละโครงการ
          const actualCostsMap: Record<string, number> = {};
          const actualCostPromises = data.responseObject.map(async (project) => {
            try {
              const actualCostData = await getProjectActualCost(project.project_id);
              if (actualCostData.success) {
                actualCostsMap[project.project_id] = actualCostData.responseObject.actualCost;
              }
            } catch (error) {
              console.error(`Error fetching actual cost for project ${project.project_id}:`, error);
            }
          });

          await Promise.all(actualCostPromises);
          setCalculatedActuals(actualCostsMap);

          // อัปเดตข้อมูลโครงการด้วยค่า Actual ที่คำนวณจากทรัพยากร
          const projectsWithActual = data.responseObject.map(project => ({
            ...project,
            actual: actualCostsMap[project.project_id] || project.actual,
            // ปรับค่า amountSpent ให้ตรงกับ actual เพื่อใช้ในการคำนวณ
            amountSpent: actualCostsMap[project.project_id] || project.amountSpent
          }));

          setProjectDetails(projectsWithActual);

          // If projectId is in URL, filter to show only that project
          if (projectId) {
            const selectedProject = projectsWithActual.filter(project => project.project_id === projectId);
            setFilteredProjects(selectedProject);

            if (selectedProject.length > 0) {
              setCurrentProject(selectedProject[0]);

              // ดึงข้อมูล progress สำหรับโครงการเดียว
              setProgressLoading(true);
              try {
                const progress = await fetchProjectProgress(projectId);

                // อัพเดต projectProgressMap
                setProjectProgressMap({ [projectId]: progress });

                // อัพเดต currentProject ด้วย progress ใหม่
                const updatedProject = {
                  ...selectedProject[0],
                  completionRate: progress
                };
                setCurrentProject(updatedProject);

                // อัพเดต filtered projects
                setFilteredProjects([updatedProject]);
              } catch (progressError) {
                console.error("Error fetching project progress:", progressError);
              } finally {
                setProgressLoading(false);
              }
            }
          } else {
            setFilteredProjects(projectsWithActual);

            // ดึงข้อมูล progress สำหรับทุกโครงการ
            setProgressLoading(true);
            const progressMap: Record<string, number> = {};
            const progressPromises = projectsWithActual.map(async (project) => {
              const progress = await fetchProjectProgress(project.project_id);
              progressMap[project.project_id] = progress;
              return { projectId: project.project_id, progress };
            });

            // รอให้การดึงข้อมูล progress ทั้งหมดเสร็จสิ้น
            const progressResults = await Promise.all(progressPromises);

            // อัพเดต projectProgressMap
            const newProgressMap: Record<string, number> = {};
            progressResults.forEach(result => {
              newProgressMap[result.projectId] = result.progress;
            });
            setProjectProgressMap(newProgressMap);

            // อัพเดตข้อมูลโครงการด้วยค่า progress ที่ดึงมาใหม่
            const progressUpdatedProjects = projectsWithActual.map(project => ({
              ...project,
              completionRate: newProgressMap[project.project_id] || project.completionRate
            }));

            setProjectDetails(progressUpdatedProjects);
            setFilteredProjects(progressUpdatedProjects);
            setProgressLoading(false);
          }

          const options = ["All", ...data.responseObject.map((project) => project.project_name)];
          setProjectOptions(options);

          // If project ID exists in URL, select only that project
          if (projectId) {
            const projectName = data.responseObject.find(p => p.project_id === projectId)?.project_name;
            if (projectName) {
              setSelectedProjects([projectName]);
            } else {
              setSelectedProjects(["All"]);
            }
          } else {
            setSelectedProjects(["All"]);
          }
        } else {
          console.error("responseObject is not an array or is empty");
          setProjectDetails([]);
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        setProjectDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  // Fetch resource summary data
  useEffect(() => {
    const fetchResourceSummary = async () => {
      if (!filteredProjects || filteredProjects.length === 0) {
        setResourceSummary([]);
        return;
      }
      try {
        let params = {};
        if (selectedProjects.length > 0 && !selectedProjects.includes("All")) {
          params = {
            project_ids: filteredProjects.map((p) => p.project_id).join(","),
          };
        }
        const res = await getResourceSummary(params);
        if (res.success) setResourceSummary(res.responseObject);
        else setResourceSummary([]);
      } catch (e) {
        console.error("Error fetching resource summary:", e);
        setResourceSummary([]);
      }
    };

    fetchResourceSummary();
  }, [filteredProjects, selectedProjects]);

  // Filter projects based on selections
  useEffect(() => {
    if (projectDetails) {
      const filtered = projectDetails.filter((project) => {
        const matchesProject =
          selectedProjects.includes("All") || selectedProjects.includes(project.project_name);
        const matchesStatus =
          selectedStatuses.includes("All") || selectedStatuses.includes(project.status);

        return matchesProject && matchesStatus;
      });

      setFilteredProjects(filtered);
    }
  }, [selectedProjects, selectedStatuses, projectDetails]);

  if (loading) {
    return <p className="text-center text-gray-500 p-8">Loading dashboard data...</p>;
  }

  if (!projectDetails || projectDetails.length === 0) {
    return <p className="text-center text-gray-500 p-8">No project data available. Please add some projects first.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3">
      <div className="container max-w-none">
        {/* Header with title */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-xl rounded-lg p-4 mb-4 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">
            {projectName ? projectName : "Manager Dashboard"}
          </h1>
          <p className="text-gray-300">Track and analyze your construction project performance</p>
        </div>

        {/* Project Progress Section - Replaces Filter Projects */}
        {currentProject && (
          <div className="bg-white shadow-xl rounded-lg p-4 md:p-5 mb-3 border border-gray-200 relative">
            {progressLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
                <p className="text-blue-600 font-medium">Loading progress data...</p>
              </div>
            )}

            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">📈 Project Progress</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Completion Progress - ใช้ progress จาก API */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4 shadow-md">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Completion</h3>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span>Progress</span>
                  <span className="font-bold">
                    {(projectProgressMap[currentProject.project_id] !== undefined
                      ? projectProgressMap[currentProject.project_id]
                      : currentProject.completionRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${projectProgressMap[currentProject.project_id] !== undefined
                        ? projectProgressMap[currentProject.project_id]
                        : currentProject.completionRate || 0}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Schedule Status */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 p-4 shadow-md">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Schedule</h3>
                <div className="flex flex-col">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Start Date:</div>
                    <div>{formatDate(currentProject.start_date)}</div>
                    <div className="font-medium">End Date:</div>
                    <div>{formatDate(currentProject.end_date)}</div>
                  </div>
                  <div className="mt-2 text-xs px-2 py-1 rounded-full bg-green-200 text-green-800 font-medium inline-block text-center w-auto self-center">
                    {new Date() < new Date(currentProject.end_date) ? "On Schedule" : "Past Due"}
                  </div>

                </div>
              </div>

              {/* Budget Usage */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-4 shadow-md">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Budget Usage</h3>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span>Usage</span>
                  <span className="font-bold">
                    {currentProject.budget > 0 ? ((currentProject.actual / currentProject.budget) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${currentProject.actual > currentProject.budget ? "bg-red-500" :
                      currentProject.actual > (currentProject.budget * 0.8) ? "bg-yellow-500" : "bg-green-500"
                      }`}
                    style={{ width: `${Math.min((currentProject.actual / currentProject.budget) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Actual: </span>
                  <span>{Number(currentProject.actual).toLocaleString()} THB</span>
                  <span className="mx-2">|</span>
                  <span className="font-medium">Budget: </span>
                  <span>{Number(currentProject.budget).toLocaleString()} THB</span>
                </div>
                <div className="mt-1 text-xs text-gray-600 italic">
                  *Actual cost calculated from resources
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budget Overview Section */}
        <div className="mb-3">
          <div className="bg-blue-50 p-4 md:p-5 rounded-lg shadow-lg text-center space-y-3 md:space-y-4 border border-blue-200 relative">
            {/* Toggle Button Top-Right */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="absolute top-2 md:top-4 right-2 md:right-4 text-blue-600 hover:text-blue-900 text-sm font-medium transition"
              title="Toggle Budget Details"
            >
              🔁 {showDetails ? "Hide Details" : "Show Details"}
            </button>

            {/* Percent Value - Clickable to toggle between % and amount */}
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-blue-800 cursor-pointer hover:text-blue-900 transition transform hover:scale-105"
              onClick={() => setShowAsPercent(!showAsPercent)}
            >
              {showAsPercent
                ? `${percent.toFixed(2)}%`
                : ((percent / 100) * (aggregatedValues?.totalBudget || 0)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              {showAsPercent ? "" : <span className="text-sm ml-1">THB</span>}
            </h2>
            <p className="text-sm md:text-base text-gray-700 font-medium tracking-wide">🎯 Budget Utilization</p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-300 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
              <div
                className={`h-3 md:h-4 rounded-full ${isOverBudget ? "bg-red-500" : percent > 80 ? "bg-yellow-400" : "bg-green-500"
                  }`}
                style={{ width: `${Math.min(percent, 100)}%`, transition: "width 0.5s ease-in-out" }}
              />
            </div>

            {/* Over Budget Alert */}
            {isOverBudget && (
              <p className="text-red-600 font-semibold mt-1 md:mt-2">
                🚨 Over Budget by {overBudgetPercent.toFixed(2)}%
              </p>
            )}

            {/* คำอธิบาย */}
            <div className="text-xs text-gray-600 mt-2 italic">
              *Actual costs are calculated automatically from resources assigned to projects
            </div>

            {/* Budget Overview Grid */}
            {showDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
                {/* Amount Spent */}
                <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                  <p className="text-gray-600 mb-1 font-medium">💸 Amount Spent</p>
                  <p className="text-lg md:text-xl font-bold text-gray-800">
                    {filteredProjects ? (
                      <>
                        {totalAmountSpent.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs">THB</span>
                      </>
                    ) : (
                      "Loading..."
                    )}
                  </p>
                </div>

                {/* Total Budget */}
                <div className="bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                  <p className="text-gray-600 mb-1 font-medium">🏗️ Total Budget</p>
                  <p className="text-lg md:text-xl font-bold text-gray-800">
                    {aggregatedValues ? (
                      <>
                        {aggregatedValues.totalBudget.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs">THB</span>
                      </>
                    ) : (
                      "Loading..."
                    )}
                  </p>
                </div>

                {/* Remaining Budget */}
                <div className="relative bg-white p-3 md:p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                  <p className="text-gray-600 mb-1 font-medium">💼 Remaining Budget</p>
                  <p className="text-lg md:text-xl font-bold text-gray-800">
                    {aggregatedValues ? (
                      <>
                        {(aggregatedValues.totalBudget - totalAmountSpent).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs">THB</span>
                      </>
                    ) : (
                      "Loading..."
                    )}
                  </p>

                  {/* Budget Status Badge */}
                  {aggregatedValues && (
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full shadow ${isOverBudget
                        ? "bg-red-200 text-red-800"
                        : percent > 80
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                        }`}
                    >
                      {isOverBudget
                        ? "Over Budget"
                        : percent > 80
                          ? "Nearing Limit"
                          : "Healthy Budget"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Content - Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Project Details */}
          <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
            <div className="bg-blue-50 shadow-lg rounded-lg border border-blue-200">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 pl-4 md:pl-5 pt-4 md:pt-5 pb-2 border-b border-blue-200">
                📋 Project Details
              </h2>

              <div
                className="grid gap-4 p-3 md:p-4 mt-2 md:mt-3 overflow-y-auto"
                style={{ minHeight: "250px", maxHeight: "280px" }}
              >
                {loading || progressLoading ? (
                  <p className="text-gray-500 text-center">Loading...</p>
                ) : filteredProjects && filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => {
                    const progressPercent =
                      project.budget > 0 ? (project.actual / project.budget) * 100 : 0;
                    const progressColor =
                      progressPercent < 80
                        ? "bg-green-400"
                        : progressPercent < 100
                          ? "bg-yellow-400"
                          : "bg-red-500";

                    const statusColorMap: Record<string, string> = {
                      "In progress": "bg-blue-100 text-blue-800",
                      Completed: "bg-green-100 text-green-800",
                      "Suspend operations": "bg-yellow-100 text-yellow-800",
                      "Project Cancellation": "bg-red-100 text-red-800",
                    };

                    return (
                      <div
                        key={project.project_id}
                        className="bg-white rounded-lg shadow-md p-3 md:p-4 border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-base md:text-lg font-bold text-blue-800">{project.project_name}</h3>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColorMap[project.status] || "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {project.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm text-gray-700">
                          <p><strong>Start:</strong> {formatDate(project.start_date)}</p>
                          <p><strong>Finish:</strong> {formatDate(project.end_date)}</p>
                          <p><strong>Actual Cost:</strong> {Number(project.actual).toLocaleString()} <span className="text-xs">THB</span></p>
                          <p><strong>Budget:</strong> {Number(project.budget).toLocaleString()} <span className="text-xs">THB</span></p>
                        </div>

                        {/* เพิ่มหมายเหตุเกี่ยวกับ Actual Cost */}
                        <div className="mt-1 text-xs text-gray-600 italic">
                          *Actual cost calculated from resources
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Budget Usage</span>
                            <span>{progressPercent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div
                              className={`h-2 rounded-full ${progressColor}`}
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Project Completion Progress */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Completion Progress</span>
                            <span>
                              {(projectProgressMap[project.project_id] !== undefined
                                ? projectProgressMap[project.project_id]
                                : project.completionRate || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{
                                width: `${projectProgressMap[project.project_id] !== undefined
                                  ? projectProgressMap[project.project_id]
                                  : project.completionRate || 0}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500">No selected projects.</p>
                )}
              </div>
            </div>

            {/* Budget Summary */}
            <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="p-3 flex flex-col items-center gap-3 md:gap-4 relative">
                <div className="absolute top-2 md:top-4 right-2 md:right-4 animate-bounce text-blue-400 text-xl">
                  💰
                </div>

                <div className="w-full max-w-md text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-4 md:px-6 py-3 md:py-4 shadow-inner border border-blue-200">
                  <h3 className="text-base md:text-lg font-bold text-blue-800 mb-1">
                    📊 Estimate At Completion
                  </h3>
                  <p className="text-xs text-blue-600 mb-2 md:mb-3">Final cost projection</p>

                  <div className="border-t border-blue-200 my-2 w-3/4 mx-auto"></div>

                  <p className="text-4xl font-extrabold text-blue-900 tracking-wide">
                    {filteredProjects && filteredProjects.length > 0 ? (
                      <>
                        {calculateLocalEAC(filteredProjects, completionRate)?.toLocaleString() || "N/A"}
                        <span className="text-xl font-medium">THB</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-lg">No Data</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Budget Summary Chart */}
              <div>
                <BudgetSummaryEAC actualBudget={actualBudget} estimatedEAC={estimatedEAC} />
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-gray-800">Cost Breakdown</h2>
            <CostBreakdown filteredProjects={filteredProjects} />
            <div className="bg-white mt-6 md:mt-8 shadow-lg rounded-lg p-4 border border-gray-200">
              <h2 className="text-base md:text-lg font-bold mb-4 text-blue-700">💰 Resource Cost Breakdown</h2>

              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="text-left px-3 py-2 md:py-3 border-b text-gray-700 text-sm md:text-base">Resource Type</th>
                      <th className="text-right pr-3 py-2 md:py-3 border-b text-gray-700 text-sm md:text-base">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects && filteredProjects.length > 0 && resourceSummary.length > 0 ? (
                      resourceSummary.map((item) => (
                        <tr key={item.type} className="hover:bg-blue-50">
                          <td className="px-3 md:px-4 py-2 md:py-3 text-sm">{item.type}</td>
                          <td className="text-right px-3 md:px-4 py-2 md:py-3 text-red-700 font-semibold text-sm">
                            {Number(item.totalCost).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-center text-gray-400 py-4">No resource data available</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-blue-50 font-bold">
                    <tr>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-blue-900 text-sm">Total</td>
                      <td className="text-right px-3 md:px-4 py-2 md:py-3 text-blue-900 text-sm">
                        {resourceSummary.reduce((sum, i) => sum + Number(i.totalCost), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
            <div className="grid gap-4 h-full">
              {/* Project Completion Rate - แสดงค่า completion rate ที่คำนวณใหม่จาก API */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg rounded-lg border border-blue-200 p-4 hover:shadow-xl transition-shadow">
                <div className="text-sm font-semibold text-blue-800 mb-2">Project Completion Rate</div>
                <ProjectCompletionRate completionRate={completionRate} />
                <div className="text-center text-xl md:text-2xl font-bold text-blue-900 mt-2 md:mt-3">
                  {completionRate.toFixed(2)}%
                </div>
                {progressLoading && (
                  <p className="text-xs text-blue-600 text-center mt-1">Updating progress data...</p>
                )}
              </div>

              {/* Utilized Duration */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg rounded-2xl border border-yellow-200 p-3 md:p-4 hover:shadow-xl transition-shadow">
                <div className="text-sm font-semibold text-yellow-800 mb-2">Utilized Duration</div>
                <UtilizedDuration utilizedDays={utilizedDays} totalDays={totalDays} />
                <div className="text-center text-xl md:text-2xl font-bold text-yellow-900 mt-2 md:mt-3">
                  {utilizedDays} days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Variance Chart - Full width at bottom */}
        <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 mt-3 border border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold mb-4">📊 Budget Variance</h2>
          <BudgetVariance filteredProjects={filteredProjects} />
        </div>
      </div>
    </div>
  );
}