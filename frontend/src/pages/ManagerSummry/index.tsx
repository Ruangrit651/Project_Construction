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
import { getProjectActualCost } from "@/services/project.service";
import { formatDate } from '../Function/FormatDate';
import { calculateTotalDuration } from '../Function/TotalDuration';

// EAC calculation function
const calculateLocalEAC = (projects: TypeDashboard[] | null) => {
  if (!projects || projects.length === 0) return null;

  // Force completion rate to 28.5% for debugging
  const completionRate = 28.5;

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

export default function ManagerSummary() {
  const location = useLocation();
  const [projectDetails, setProjectDetails] = useState<TypeDashboard[] | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<TypeDashboard[] | null>(null);
  const [projectOptions, setProjectOptions] = useState<string[]>(["All"]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(["All"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [showAsPercent, setShowAsPercent] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [resourceSummary, setResourceSummary] = useState<{ type: string; quantity: number; totalCost: number }[]>([]);
  // เพิ่ม state เก็บค่า Actual ที่คำนวณจากทรัพยากร
  const [calculatedActuals, setCalculatedActuals] = useState<Record<string, number>>({});

  // Get project ID from URL if available
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get('project_id');

  // Calculate metrics based on filtered projects
  const aggregatedValues = filteredProjects ? calculateAggregatedValues(filteredProjects) : null;
  const completionRate = filteredProjects ? calculateCompletionRate(filteredProjects) : 0;
  const totalAmountSpent = filteredProjects ? calculateTotalAmountSpent(filteredProjects) : 0;
  const utilizedDays = filteredProjects ? calculateUtilizedDuration(filteredProjects) : 0;
  const actualBudget = filteredProjects
    ? filteredProjects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0)
    : 0;
  const estimatedEAC = calculateLocalEAC(filteredProjects) || 0;
  const { percent, isOverBudget, overBudgetPercent } = calculatePercentOfTarget(filteredProjects);
  const totalDays = filteredProjects ? calculateTotalDuration(filteredProjects) : 0;

  // Fetch project data
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const data = await getDashboard();
        if (Array.isArray(data.responseObject) && data.responseObject.length > 0) {
          // ดึงค่า Actual Cost ที่คำนวณจากทรัพยากร
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
          const updatedProjects = data.responseObject.map(project => ({
            ...project,
            actual: actualCostsMap[project.project_id] || project.actual,
            // ปรับค่า amountSpent ให้ตรงกับ actual เพื่อใช้ในการคำนวณ
            amountSpent: actualCostsMap[project.project_id] || project.amountSpent
          }));

          setProjectDetails(updatedProjects);

          // If projectId is in URL, filter to show only that project
          if (projectId) {
            const selectedProject = updatedProjects.filter(project => project.project_id === projectId);
            setFilteredProjects(selectedProject);
          } else {
            setFilteredProjects(updatedProjects);
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

  // Show loading or no data message
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
          <h1 className="text-2xl md:text-3xl font-bold">Manager Summary</h1>
          <p className="text-gray-300">Track and analyze your construction projects performance</p>
        </div>

        {/* Project Filter Section */}
        <div className="bg-white shadow-xl rounded-lg p-4 md:p-5 mb-3 border border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">🔍 Filter Projects</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Project Name Filter */}
            <div className="p-4 md:p-5 rounded-xl border border-gray-300 shadow-sm bg-gray-50 hover:shadow-md transition">
              <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2 md:mb-3">📁 Project Name</h3>
              <CustomSelect
                options={projectOptions}
                placeholder="Select Projects"
                selectedOptions={selectedProjects}
                onChange={(value: string[]) => setSelectedProjects(value)}
              />
            </div>

            {/* Project Status Filter */}
            <div className="p-4 md:p-5 rounded-xl border border-gray-300 shadow-sm bg-gray-50 hover:shadow-md transition">
              <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2 md:mb-3">📌 Project Status</h3>
              <CustomSelect
                options={["All", "In progress", "Completed", "Suspend operations", "Project Cancellation"]}
                placeholder="Select Status"
                selectedOptions={selectedStatuses}
                onChange={(value: string[]) => setSelectedStatuses(value)}
              />
            </div>
          </div>
        </div>

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

            {/* เพิ่มข้อความอธิบายว่า Actual คำนวณจากทรัพยากร */}
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
                {loading ? (
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

                        {/* เพิ่มข้อความอธิบายว่า Actual คำนวณจากทรัพยากร */}
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

                        {/* Completion Progress - Added new section */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Completion Progress</span>
                            <span>{(project.completionRate || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div
                              className={`h-2 rounded-full ${(project.completionRate || 0) < 30
                                ? "bg-red-400"
                                : (project.completionRate || 0) < 70
                                  ? "bg-yellow-400"
                                  : "bg-green-500"
                                }`}
                              style={{ width: `${Math.min(project.completionRate || 0, 100)}%` }}
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
                        {calculateLocalEAC(filteredProjects)?.toLocaleString() || "N/A"}{" "}
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
                      <th className="text-center px-3 py-2 md:py-3 border-b text-gray-700 text-sm md:text-base">Quantity</th>
                      <th className="text-right pr-3 py-2 md:py-3 border-b text-gray-700 text-sm md:text-base">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects && filteredProjects.length > 0 && resourceSummary.length > 0 ? (
                      resourceSummary.map((item) => (
                        <tr key={item.type} className="hover:bg-blue-50">
                          <td className="px-3 md:px-4 py-2 md:py-3 text-sm">{item.type}</td>
                          <td className="text-center px-3 md:px-4 py-2 md:py-3 text-sm">
                            {Number(item.quantity).toLocaleString()}
                          </td>
                          <td className="text-right px-3 md:px-4 py-2 md:py-3 text-red-700 font-semibold text-sm">
                            {Number(item.totalCost).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center text-gray-400 py-4">No resource data available</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-blue-50 font-bold">
                    <tr>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-blue-900 text-sm">Total</td>
                      <td className="text-center px-3 md:px-4 py-2 md:py-3 text-blue-900 text-sm">
                        {resourceSummary.reduce((sum, i) => sum + Number(i.quantity), 0).toLocaleString()}
                      </td>
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
              {/* Project Completion Rate */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg rounded-lg border border-blue-200 p-4 hover:shadow-xl transition-shadow">
                <div className="text-sm font-semibold text-blue-800 mb-2">Project Completion Rate</div>
                <ProjectCompletionRate completionRate={completionRate} />
                <div className="text-center text-xl md:text-2xl font-bold text-blue-900 mt-2 md:mt-3">
                  {completionRate.toFixed(2)}%
                </div>
              </div>

              {/* Utilized Duration */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg rounded-lg border border-yellow-200 p-4 hover:shadow-xl transition-shadow">
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