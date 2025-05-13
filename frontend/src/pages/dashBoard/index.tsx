import React, { useState, useEffect } from "react";
import CustomSelect from "./CustomSelect"; // Ensure this path is correct
import { TypeDashboard } from "@/types/response/response.dashboard"; // Ensure this path is correct
import { getDashboard } from "@/services/dashboard.service";
import BudgetVariance from "./BudgetVariance";
import ProjectCompletionRate from "./ProjectCompletionRate";
import UtilizedDuration from "./UtilizedDuration";
import CostBreakdown from "./CostBreakdown";
import BudgetSummaryEAC from "./BudgetSummaryEAC"; // Ensure this path is correct

// ฟังก์ชันคำนวณ Estimate At Completion (EAC)
// EAC = AC + (BAC - EV)
const calculateLocalEAC = (projects: TypeDashboard[] | null) => {
  if (!projects || projects.length === 0) return null;

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0); // BAC (Budget At Completion)
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.amountSpent || 0), 0); // AC (Actual Cost)
  const totalProgress = projects.reduce((sum, project) => sum + (project.completionRate || 0), 0) / projects.length; // ความก้าวหน้าเฉลี่ย (%)

  const earnedValue = (totalProgress / 100) * totalBudget; // EV (Earned Value)
  const eac = totalAmountSpent + (totalBudget - earnedValue); // สูตรคำนวณ EAC


  return eac;
};

// ฟังก์ชันคำนวณเปอร์เซ็นต์การใช้จ่ายเทียบกับงบประมาณ
const calculatePercentOfTarget = (projects: TypeDashboard[] | null) => {
  if (!projects || projects.length === 0) {
    return { percent: 0, isOverBudget: false, overBudgetPercent: 0 };
  }

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0); // รวมงบประมาณทั้งหมด
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.amountSpent || 0), 0); // รวมค่าใช้จ่ายจริง

  const percent = totalBudget > 0 ? (totalAmountSpent / totalBudget) * 100 : 0; // เปอร์เซ็นต์การใช้งบ
  const isOverBudget = totalAmountSpent > totalBudget; // ตรวจสอบว่าเกินงบหรือไม่
  const overBudgetPercent = isOverBudget ? ((totalAmountSpent - totalBudget) / totalBudget) * 100 : 0; // คำนวณ % ที่เกินงบ

  return { percent, isOverBudget, overBudgetPercent };
};

// ฟังก์ชันคำนวณยอดรวมของค่าใช้จ่ายจริงทั้งหมด
const calculateTotalAmountSpent = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;
  return projects.reduce((sum, project) => sum + Number(project.amountSpent || 0), 0);
};

// ฟังก์ชันคำนวณงบประมาณที่เหลือ (Budget Variance)
// BV = BAC - AC
const calculateBudgetVariance = (projects: TypeDashboard[] | null) => {
  if (!projects || projects.length === 0) {
    return { variance: 0, variancePercentage: 0 };
  }

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0);
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.amountSpent || 0), 0);

  const variance = totalBudget - totalAmountSpent; // ค่าความคลาดเคลื่อนของงบ
  const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0; // เปอร์เซ็นต์ของค่าความคลาดเคลื่อน

  return { variance, variancePercentage };
};

// ฟังก์ชันคำนวณค่าสรุปรวม (รวมงบประมาณ, ค่าใช้จ่าย, เปอร์เซ็นต์เป้าหมาย)
const calculateAggregatedValues = (projects: TypeDashboard[]) => {
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget), 0);
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.amountSpent), 0);
  const percentTarget = totalBudget > 0 ? (totalAmountSpent / totalBudget) * 100 : 0;

  return { totalBudget, totalAmountSpent, percentTarget };
};

// ฟังก์ชันคำนวณอัตราความสำเร็จเฉลี่ย (Completion Rate)
const calculateCompletionRate = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const totalCompletion = projects.reduce((sum, project) => sum + (project.completionRate || 0), 0);
  return (totalCompletion / projects.length) * 100; // เฉลี่ยเปอร์เซ็นต์ของ completion rate
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

const Dashboard = () => {
  // ตัวแปร state สำหรับเก็บข้อมูลโปรเจกต์ทั้งหมด
  const [projectDetails, setProjectDetails] = useState<TypeDashboard[] | null>(null);
  // ตัวแปร state สำหรับเก็บโปรเจกต์ที่ผ่านการกรองแล้ว
  const [filteredProjects, setFilteredProjects] = useState<TypeDashboard[] | null>(null);
  // ตัวเลือกชื่อโปรเจกต์ทั้งหมด (ใช้สำหรับ dropdown filter)
  const [projectOptions, setProjectOptions] = useState<string[]>(["All"]);
  // รายชื่อโปรเจกต์ที่ผู้ใช้เลือก (ค่าเริ่มต้นเป็น "All")
  const [selectedProjects, setSelectedProjects] = useState<string[]>(["All"]);
  // รายการสถานะโปรเจกต์ที่เลือก (ค่าเริ่มต้นเป็น "All")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["All"]);
  // สถานะโหลดข้อมูล
  const [loading, setLoading] = useState(true);
  // State สำหรับสลับการแสดงผล
  const [showAsPercent, setShowAsPercent] = useState(true);

  // คำนวณค่า actualBudget และ estimatedEAC
  const actualBudget = filteredProjects
    ? filteredProjects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0)
    : 0;

  const estimatedEAC = calculateLocalEAC(filteredProjects) || 0;

  // คำนวณค่า Budget Variance 
  const [showDetails, setShowDetails] = useState(true);

  // ค่าที่คำนวณได้จากโปรเจกต์ที่กรองแล้ว
  const totalAmountSpent = calculateTotalAmountSpent(filteredProjects); // ยอดที่ใช้ไปทั้งหมด
  const completionRate = filteredProjects ? calculateCompletionRate(filteredProjects) : 0; // อัตราการดำเนินการเสร็จสิ้น
  const utilizedDays = calculateUtilizedDuration(filteredProjects); // จำนวนวันที่ใช้ไปแล้ว
  const percentOfTarget = filteredProjects
    ? calculatePercentOfTarget(filteredProjects) // เปอร์เซ็นต์การใช้งบประมาณ
    : { percent: 0, isOverBudget: false, overBudgetPercent: 0 };
  const { percent, isOverBudget, overBudgetPercent } = percentOfTarget;

  // ค่ารวมทั้งหมดจากโปรเจกต์ที่เลือก
  const aggregatedValues = projectDetails
    ? calculateAggregatedValues(
      selectedProjects.includes("All")
        ? projectDetails
        : projectDetails.filter((project) => selectedProjects.includes(project.project_name))
    )
    : null;

  // โหลดข้อมูลโปรเจกต์จาก API เมื่อ component ถูก mount ครั้งแรก
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const data = await getDashboard(); // ดึงข้อมูลจาก API
        if (Array.isArray(data.responseObject) && data.responseObject.length > 0) {
          // ถ้าข้อมูลถูกต้อง
          setProjectDetails(data.responseObject); // เก็บข้อมูลทั้งหมด
          setFilteredProjects(data.responseObject); // ตั้งค่าข้อมูลเริ่มต้นให้เหมือนกับทั้งหมด

          // สร้างรายการชื่อโปรเจกต์ (รวม "All" ไว้ที่หัว)
          const options = ["All", ...data.responseObject.map((project) => project.project_name)];
          setProjectOptions(options);
          setSelectedProjects(["All"]); // เลือก All เป็นค่าเริ่มต้น
        } else {
          console.error("responseObject is not an array or is empty");
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false); // ปิดสถานะกำลังโหลดไม่ว่าจะสำเร็จหรือเกิดข้อผิดพลาด
      }
    };

    fetchProjectDetails(); // เรียกใช้ฟังก์ชันดึงข้อมูล
  }, []);

  // กรองข้อมูลโปรเจกต์ใหม่ทุกครั้งที่ผู้ใช้เลือกโปรเจกต์หรือสถานะใหม่
  useEffect(() => {
    if (projectDetails) {
      const filtered = projectDetails.filter((project) => {
        // ตรวจสอบว่าโปรเจกต์นี้อยู่ในรายการที่เลือกหรือไม่
        const matchesProject =
          selectedProjects.includes("All") || selectedProjects.includes(project.project_name);
        // ตรวจสอบว่าสถานะของโปรเจกต์ตรงกับที่เลือกหรือไม่
        const matchesStatus =
          selectedStatuses.includes("All") || selectedStatuses.includes(project.status);

        return matchesProject && matchesStatus; // เฉพาะโปรเจกต์ที่ผ่านทั้งสองเงื่อนไข
      });

      // อัปเดต filteredProjects ถ้ามีรายการตรงกับเงื่อนไข
      setFilteredProjects(filtered.length > 0 ? filtered : null);
    }
  }, [selectedProjects, selectedStatuses, projectDetails]); // ทำงานใหม่เมื่อ state เหล่านี้เปลี่ยน


  // Render the Dashboard
  return (
    <div className="min-h-screen bg-gray-400 p-3">
      <div className="container mx-auto">
        {/* Project Filter Section */}
        <div className="bg-white shadow-xl rounded-2xl p-5 mb-3 border border-zinc-800 ">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 ">🔍 Filter Projects</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name Filter */}
            <div className="p-5 rounded-xl border border-gray-800 shadow-sm bg-gray-100 hover:shadow-md transition">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">📁 Project Name</h3>
              <CustomSelect
                options={projectOptions}
                placeholder="Select Projects"
                selectedOptions={selectedProjects}
                onChange={(value: string[]) => setSelectedProjects(value)}
              />
            </div>

            {/* Project Status Filter */}
            <div className="p-5 rounded-xl border border-gray-800 shadow-sm bg-gray-100 hover:shadow-md transition">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">📌 Project Status</h3>
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
          <div className="bg-indigo-100 p-5 rounded-2xl shadow-xl text-center space-y-4 border border-indigo-300 relative">
            {/* Toggle Button Top-Right */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="absolute top-4 right-4 text-indigo-600 hover:text-indigo-900 text-sm font-medium transition"
              title="Toggle Budget Details"
            >
              🔁 {showDetails ? "Hide Details" : "Show Details"}
            </button>

            {/* Percent Value */}
            <h2
              className="text-4xl md:text-5xl font-extrabold text-indigo-800 cursor-pointer hover:text-indigo-900 transition transform hover:scale-105"
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
            <p className="text-base text-gray-700 font-medium tracking-wide">🎯 Percent of Target Budget</p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className={`h-4 rounded-full ${isOverBudget ? "bg-red-500" : percent > 80 ? "bg-yellow-400" : "bg-green-500"}`}
                style={{ width: `${Math.min(percent, 100)}%`, transition: "width 0.5s ease-in-out" }}
              />
            </div>

            {/* Over Budget Alert */}
            {isOverBudget && (
              <p className="text-red-600 font-semibold mt-2">
                🚨 Over Budget by {overBudgetPercent.toFixed(2)}%
              </p>
            )}

            {/* Budget Overview Grid */}
            {showDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm">
                {/* Amount Spent */}
                <div className="bg-white p-4 rounded-xl shadow border border-gray-300 hover:shadow-md transition">
                  <p className="text-gray-600 mb-1 font-medium">💸 Amount Spent</p>
                  <p className="text-xl font-bold text-gray-800">
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
                <div className="bg-white p-4 rounded-xl shadow border border-gray-300 hover:shadow-md transition">
                  <p className="text-gray-600 mb-1 font-medium">🏗️ Total Budget</p>
                  <p className="text-xl font-bold text-gray-800">
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
                <div className="relative bg-white p-4 rounded-xl shadow border border-gray-300 hover:shadow-md transition">
                  <p className="text-gray-600 mb-1 font-medium">💼 Remaining Budget</p>
                  <p className="text-xl font-bold text-gray-800">
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


        {/* Dashboard Content */}
        <div className="grid grid-cols-3 gap-3">
          {/* Project Details */}
          <div className="bg-white shadow-lg rounded-lg p-2 border border-gray-200">
            <div className="bg-indigo-50 shadow-xl rounded-2xl border border-indigo-200">
              <h2 className="text-2xl font-bold text-gray-800 pl-5 pt-5 border-b">📋 Project Details</h2>

              <div
                className="grid gap-5 p-4 mt-3 overflow-y-auto"
                style={{ minHeight: "280px", maxHeight: "280px" }}
              >
                {loading ? (
                  <p className="text-gray-500 text-center">Loading...</p>
                ) : filteredProjects && filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => {
                    const progressPercent = (project.actual / project.budget) * 100;
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
                        className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-indigo-800">{project.project_name}</h3>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColorMap[project.status] || "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {project.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                          <p><strong>Start:</strong> {new Date(project.start_date).toLocaleDateString()}</p>
                          <p><strong>Finish:</strong> {new Date(project.end_date).toLocaleDateString()}</p>
                          <p><strong>Actual Cost:</strong> {Number(project.actual).toLocaleString()} <span className="text-xs">THB</span></p>
                          <p><strong>Budget:</strong> {Number(project.budget).toLocaleString()} <span className="text-xs">THB</span></p>
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
              <div className="p-3 flex flex-col items-center gap-4 relative">
                {/* Decorative icon */}
                <div className="absolute top-4 right-4 animate-bounce text-sky-400 text-xl">
                  💰
                </div>

                <div className="w-full max-w-md text-center bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl px-6 py-4 shadow-inner border border-sky-200">
                  <h3 className="text-lg font-bold text-sky-800 mb-1">
                    📊 Estimate At Completion
                  </h3>
                  <p className="text-xs text-sky-600 mb-3">Final cost prediction for the entire project</p>

                  <div className="border-t border-sky-200 my-2 w-3/4 mx-auto"></div>

                  <p className="text-4xl font-extrabold text-sky-900 tracking-wide">
                    {filteredProjects ? (
                      <>
                        {calculateLocalEAC(filteredProjects)?.toLocaleString() || "N/A"}{" "}
                        <span className="text-xl font-medium">THB</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-lg">Loading...</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Budget Summary Chart */}
              <div>
                <BudgetSummaryEAC actualBudget={actualBudget} estimatedEAC={estimatedEAC} />
              </div>
            </div>
          </div >

          {/* Cost Breakdown */}
          < div className="bg-white shadow-lg rounded-lg p-2 border border-gray-200" >
            <h2 className="text-xl font-semibold mb-12 mt-6 ml-6">Cost Breakdown</h2>
            <CostBreakdown filteredProjects={filteredProjects} />
            <div className="bg-white mt-12 shadow-lg rounded-lg p-1 border border-gray-200">
              <h2 className="text-l font-bold mb-6 mt-6 text-indigo-700">💰 Resource Cost Breakdown</h2>

              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="text-left px-2 py-3 border-b text-gray-700">Resource Type</th>
                      <th className="text-center px-2 py-3 border-b text-gray-700">Quantity</th>
                      <th className="text-right pr-2 py-3 border-b text-gray-700">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3">🛠️ Equipment</td>
                      <td className="text-center px-4 py-3">15</td>
                      <td className="text-right px-4 py-3 text-red-700 font-semibold">159,801</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">👷 Labor</td>
                      <td className="text-center px-4 py-3">30</td>
                      <td className="text-right px-4 py-3 text-red-700 font-semibold">157,986</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">🧱 Material</td>
                      <td className="text-center px-4 py-3">47</td>
                      <td className="text-right px-4 py-3 text-red-700 font-semibold">161,837</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">🤝 Subcontractors</td>
                      <td className="text-center px-4 py-3">10</td>
                      <td className="text-right px-4 py-3 text-red-700 font-semibold">151,775</td>
                    </tr>
                  </tbody>

                  <tfoot className="bg-indigo-50 font-bold">
                    <tr>
                      <td className="px-4 py-3 text-indigo-900">Total</td>
                      <td className="text-center px-4 py-3 text-indigo-900">102</td>
                      <td className="text-right px-4 py-3 text-indigo-900">
                        {(
                          159801 + 157986 + 161837 + 151775
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div >

          {/* Charts Section */}
          <div className="grid bg-white shadow-xl rounded-2xl p-6 border border-gray-200 gap-4 overflow-x-auto">
            <div className="grid gap-4 overflow-x-auto">
              {/* Project Completion Rate */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg rounded-2xl border border-blue-200 p-4 hover:shadow-xl transition-shadow">
                <div className="text-sm font-semibold text-blue-800 mb-2">Project Completion Rate</div>
                <ProjectCompletionRate completionRate={completionRate} />
                <div className="text-center text-2xl font-bold text-blue-900 mt-3">
                  {completionRate.toFixed(2)}%
                </div>
              </div>

              {/* Utilized Duration */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg rounded-2xl border border-yellow-200 p-4 hover:shadow-xl transition-shadow">
                <div className="text-sm font-semibold text-yellow-800 mb-2">Utilized Duration</div>
                <UtilizedDuration utilizedDays={utilizedDays} />
                <div className="text-center text-2xl font-bold text-yellow-900 mt-3">
                  {utilizedDays} days
                </div>
              </div>
            </div>
          </div>
        </div >
        <div >

          {/* Budget Variance Chart */}
          <div className="bg-white shadow-lg rounded-lg p-6 mt-3 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">📊 Budget Variance</h2>
            <BudgetVariance filteredProjects={filteredProjects} />
          </div>

        </div>
      </div >
    </div >
  );
};

export default Dashboard;