import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // เพิ่ม import
import CustomSelect from "./CustomSelect"; // Ensure this path is correct
import { TypeDashboard } from "@/types/response/response.dashboard"; // Ensure this path is correct
import { getDashboard } from "@/services/dashboard.service";
import BudgetVariance from "./BudgetVariance";
import ProjectCompletionRate from "./ProjectCompletionRate";
import UtilizedDuration from "./UtilizedDuration";
import CostBreakdown from "./CostBreakdown";
import BudgetSummaryEAC from "./BudgetSummaryEAC"; // Ensure this path is correct
import { getResourceSummary } from "@/services/resource.service";
import { getProjectActualCost } from "@/services/project.service";
import { formatDate } from '../Function/FormatDate';
import { calculateTotalDuration } from '../Function/TotalDuration'; // Ensure this path is correct


// ฟังก์ชันคำนวณ Estimate At Completion (EAC)
// EAC = AC + (BAC - EV)
const calculateLocalEAC = (projects: TypeDashboard[] | null, completionRate: number) => {
  if (!projects || projects.length === 0) return null;

  // ใช้ค่า completionRate ที่ส่งเข้ามาแทนค่าคงที่
  // const completionRate = 28.5; // ลบบรรทัดนี้ออก

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0); // BAC
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.actual || project.amountSpent || 0), 0); // AC

  // Calculate EV using the actual completion rate
  const earnedValue = (completionRate / 100) * totalBudget;

  console.log("EAC Calculation Details:", {
    BAC: totalBudget,
    AC: totalAmountSpent,
    EV: earnedValue,
    completionRate: completionRate,
    formula: "EAC = AC + (BAC - EV)"
  });

  const eac = totalAmountSpent + (totalBudget - earnedValue);
  return eac;
};

// ฟังก์ชันคำนวณเปอร์เซ็นต์การใช้จ่ายเทียบกับงบประมาณ
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

// ฟังก์ชันคำนวณยอดรวมของค่าใช้จ่ายจริงทั้งหมด
const calculateTotalAmountSpent = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;
  // ใช้ actual แทน amountSpent
  return projects.reduce((sum, project) => sum + Number(project.actual || project.amountSpent || 0), 0);
};

// ฟังก์ชันคำนวณงบประมาณที่เหลือ (Budget Variance)
// BV = BAC - AC
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

// ฟังก์ชันคำนวณค่าสรุปรวม (รวมงบประมาณ, ค่าใช้จ่าย, เปอร์เซ็นต์เป้าหมาย)
const calculateAggregatedValues = (projects: TypeDashboard[]) => {
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget), 0);
  // ใช้ actual แทน amountSpent
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.actual || project.amountSpent), 0);
  const percentTarget = totalBudget > 0 ? (totalAmountSpent / totalBudget) * 100 : 0;

  return { totalBudget, totalAmountSpent, percentTarget };
};

// ฟังก์ชันคำนวณอัตราความสำเร็จเฉลี่ย (Completion Rate)
const calculateCompletionRate = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const totalCompletion = projects.reduce((sum, project) => sum + (project.completionRate || 0), 0);
  return projects.length > 0 ? totalCompletion / projects.length : 0; // ตรวจสอบจำนวนโปรเจกต์ก่อนหาร
};

// ฟังก์ชันคำนวณจำนวนวันรวมที่ใช้งานไปแล้ว (นับจากวันที่เริ่มจนถึงวันนี้)
const calculateUtilizedDuration = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const today = new Date();
  const totalDays = projects.reduce((sum, project) => {
    const startDate = new Date(project.start_date); // วันที่เริ่มต้นของโปรเจกต์
    const duration = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))); // จำนวนวันตั้งแต่เริ่มจนถึงวันนี้
    return sum + duration;
  }, 0);

  return totalDays;
};

// =========================================================================================

const Summary = () => {
  // ตัวแปร state สำหรับเก็บข้อมูลโปรเจกต์ทั้งหมด
  const [projectDetails, setProjectDetails] = useState<TypeDashboard[] | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<TypeDashboard[] | null>(null);
  const [projectOptions, setProjectOptions] = useState<string[]>(["All"]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(["All"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [showAsPercent, setShowAsPercent] = useState(true);
  const aggregatedValues = filteredProjects ? calculateAggregatedValues(filteredProjects) : null;
  const completionRate = filteredProjects ? calculateCompletionRate(filteredProjects) : 0;
  const totalAmountSpent = filteredProjects ? calculateTotalAmountSpent(filteredProjects) : 0;
  const utilizedDays = filteredProjects ? calculateUtilizedDuration(filteredProjects) : 0;
  const actualBudget = filteredProjects
    ? filteredProjects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0)
    : 0;

  const estimatedEAC = calculateLocalEAC(filteredProjects, completionRate) || 0;
  const { percent, isOverBudget, overBudgetPercent } = calculatePercentOfTarget(filteredProjects);
  const [showDetails, setShowDetails] = useState(true);
  const [resourceSummary, setResourceSummary] = useState<{ type: string; quantity: number; totalCost: number }[]>([]);
  const [calculatedActuals, setCalculatedActuals] = useState<Record<string, number>>({});
  const totalDays = filteredProjects ? calculateTotalDuration(filteredProjects) : 0;

  useEffect(() => {
    const fetchResourceSummary = async () => {
      if (!filteredProjects || filteredProjects.length === 0) {
        setResourceSummary([]);
        return;
      }
      try {
        let params = {};
        // console.log("Selected projects:", selectedProjects);
        if (selectedProjects.length > 0) {
          params = {
            project_ids: filteredProjects.map((p) => p.project_id).join(","),
          };
        }
        // console.log("Fetching resource summary with params:", params);
        const res = await getResourceSummary(params);
        // console.log("Resource summary response:", res);
        if (res.success) setResourceSummary(res.responseObject);
        else setResourceSummary([]);
      } catch (e) {
        setResourceSummary([]);
      }
    };
    fetchResourceSummary();
  }, [filteredProjects, selectedProjects]);

  // คำนวณค่าใช้จ่ายที่เกินงบประมาณ
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
          setFilteredProjects(updatedProjects);

          const options = ["All", ...data.responseObject.map((project) => project.project_name)];
          setProjectOptions(options);
          setSelectedProjects(["All"]);
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
  }, []);

  // คำนวณค่าใช้จ่ายที่เกินงบประมาณ
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

  // ตรวจสอบว่ามีข้อมูลโปรเจกต์หรือไม่
  if (!projectDetails || projectDetails.length === 0) {
    return <p className="text-center text-gray-500">No project data available.</p>;
  }

  // Render the Dashboard
  return (
    <div className="min-h-screen bg-gray-100 p-3">
      <div className="container max-w-none">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-xl rounded-lg p-4 mb-4 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">CEO Summary</h1>
          <p className="text-gray-300">Executive overview of all construction projects</p>
        </div>
        {/* Project Filter Section */}
        <div className="bg-white shadow-xl rounded-2xl p-4 md:p-5 mb-3 border border-zinc-800">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">🔍 Filter Projects</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Project Name Filter */}
            <div className="p-4 md:p-5 rounded-xl border border-gray-800 shadow-sm bg-gray-100 hover:shadow-md transition">
              <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2 md:mb-3">📁 Project Name</h3>
              <CustomSelect
                options={projectOptions}
                placeholder="Select Projects"
                selectedOptions={selectedProjects}
                onChange={(value: string[]) => setSelectedProjects(value)}
              />
            </div>

            {/* Project Status Filter */}
            <div className="p-4 md:p-5 rounded-xl border border-gray-800 shadow-sm bg-gray-100 hover:shadow-md transition">
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

        <div className="mb-3">
          <div className="bg-indigo-100 p-4 md:p-5 rounded-2xl shadow-xl text-center space-y-3 md:space-y-4 border border-indigo-300 relative">
            {/* Toggle Button Top-Right */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="absolute top-2 md:top-4 right-2 md:right-4 text-indigo-600 hover:text-indigo-900 text-sm font-medium transition"
              title="Toggle Budget Details"
            >
              🔁 {showDetails ? "Hide Details" : "Show Details"}
            </button>

            {/* Percent Value */}
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-indigo-800 cursor-pointer hover:text-indigo-900 transition transform hover:scale-105"
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
            <p className="text-sm md:text-base text-gray-700 font-medium tracking-wide">🎯 Percent of Target Budget</p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-300 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
              <div
                className={`h-3 md:h-4 rounded-full ${isOverBudget ? "bg-red-500" : percent > 80 ? "bg-yellow-400" : "bg-green-500"}`}
                style={{ width: `${Math.min(percent, 100)}%`, transition: "width 0.5s ease-in-out" }}
              />
            </div>

            {/* Over Budget Alert */}
            {isOverBudget && (
              <p className="text-red-600 font-semibold mt-1 md:mt-2">
                🚨 Over Budget by {overBudgetPercent.toFixed(2)}%
              </p>
            )}

            {/* Budget Overview Grid */}
            {showDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6 text-sm">
                {/* Amount Spent */}
                <div className="bg-white p-3 md:p-4 rounded-xl shadow border border-gray-300 hover:shadow-md transition">
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
                <div className="bg-white p-3 md:p-4 rounded-xl shadow border border-gray-300 hover:shadow-md transition">
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
                    ) : filteredProjects && filteredProjects.length > 0 ? (
                      <>
                        {filteredProjects[0].totalBudget.toLocaleString(undefined, {
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
                <div className="relative bg-white p-3 md:p-4 rounded-xl shadow border border-gray-300 hover:shadow-md transition">
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

                  {/* Budget Status Badge - Positioned Top Right */}
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

        {/* Dashboard Content - Improved responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Project Details */}
          <div className="bg-white shadow-lg rounded-lg p-2 border border-gray-200">
            <div className="bg-indigo-50 shadow-xl rounded-2xl border border-indigo-200">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 pl-4 md:pl-5 pt-4 md:pt-5 border-b">📋 Project Details</h2>

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
                        className="bg-white rounded-xl shadow-md p-3 md:p-4 border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-base md:text-lg font-bold text-indigo-800">{project.project_name}</h3>
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

                        {/* เพิ่มหมายเหตุเกี่ยวกับ Actual Cost ตรงนี้ */}
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
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500">No selected projects.</p>
                )}
              </div>
            </div>

            {/* Budget Summary */}
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white shadow-lg transition-shadow hover:shadow-xl">
              <div className="p-3 flex flex-col items-center gap-3 md:gap-4 relative">
                {/* Decorative icon */}
                <div className="absolute top-2 md:top-4 right-2 md:right-4 animate-bounce text-sky-400 text-xl">
                  💰
                </div>

                <div className="w-full max-w-md text-center bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl px-4 md:px-6 py-3 md:py-4 shadow-inner border border-sky-200">
                  <h3 className="text-base md:text-lg font-bold text-sky-800 mb-1">
                    📊 Estimate At Completion
                  </h3>
                  <p className="text-xs text-sky-600 mb-2 md:mb-3">Final cost prediction for the entire project</p>

                  <div className="border-t border-sky-200 my-2 w-3/4 mx-auto"></div>

                  <p className="text-4xl font-extrabold text-sky-900 tracking-wide">
                    {filteredProjects && filteredProjects.length > 0 ? (
                      <>
                        {calculateLocalEAC(filteredProjects, completionRate)?.toLocaleString() || "No Data Available"}
                        <span className="text-xl font-medium">THB</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-lg">No Data Available</span>
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
          <div className="bg-white shadow-lg rounded-lg p-2 border border-gray-200">
            <h2 className="text-lg md:text-xl font-semibold mb-8 md:mb-12 mt-4 md:mt-6 ml-4 md:ml-6">Cost Breakdown</h2>
            <CostBreakdown filteredProjects={filteredProjects} />
            <div className="bg-white mt-8 md:mt-12 shadow-lg rounded-lg p-1 border border-gray-200">
              <h2 className="text-base md:text-lg font-bold mb-4 md:mb-5 mt-4  text-indigo-700 px-3">💰 Resource Cost Breakdown</h2>

              <div className="overflow-x-auto rounded-lg ">
                <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="text-left px-2 py-2 md:py-3 border-b text-gray-700 text-sm md:text-base">Resource Type</th>
                      <th className="text-center px-2 py-2 md:py-3 border-b text-gray-700 text-sm md:text-base">Quantity</th>
                      <th className="text-right pr-2 py-2 md:py-3 border-b text-gray-700 text-sm md:text-base">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects && filteredProjects.length > 0 && resourceSummary.length > 0 ? (
                      resourceSummary.map((item) => (
                        <tr key={item.type}>
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
                        <td colSpan={3} className="text-center text-gray-400 py-4">No data</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-indigo-50 font-bold">
                    <tr>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-indigo-900 text-sm">Total</td>
                      <td className="text-center px-3 md:px-4 py-2 md:py-3 text-indigo-900 text-sm">
                        {resourceSummary.reduce((sum, i) => sum + Number(i.quantity), 0).toLocaleString()}
                      </td>
                      <td className="text-right px-3 md:px-4 py-2 md:py-3 text-indigo-900 text-sm">
                        {resourceSummary.reduce((sum, i) => sum + Number(i.totalCost), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-white shadow-xl rounded-2xl p-4 md:p-6 border border-gray-200">
            <div className="grid gap-4 h-full">
              {/* Project Completion Rate */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg rounded-2xl border border-blue-200 p-3 md:p-4 hover:shadow-xl transition-shadow">
                <div className="text-sm font-semibold text-blue-800 mb-2">Project Completion Rate</div>
                <ProjectCompletionRate completionRate={completionRate} />
                <div className="text-center text-xl md:text-2xl font-bold text-blue-900 mt-2 md:mt-3">
                  {completionRate.toFixed(2)}%
                </div>
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
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">📊 Budget Variance</h2>
          <BudgetVariance filteredProjects={filteredProjects} />
        </div>
      </div>
    </div>
  );
};


export default Summary;