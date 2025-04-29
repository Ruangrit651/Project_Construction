import React, { useState, useEffect, useRef } from "react";
import ReactApexChart from "react-apexcharts";
import { getDashboard } from "@/services/dashboard.service";
import { TypeDashboard } from "@/types/response/response.dashboard"; // Ensure this path is correct
// import { getCostBreakdownData } from "@/services/dashboard.service"; // Ensure this path is correct


const BudgetVariance = ({ filteredProjects }: { filteredProjects: TypeDashboard[] | null }) => {
  if (!filteredProjects || filteredProjects.length === 0) {
    return <p>No data available</p>;
  }

  const categories = filteredProjects.map(project => project.project_name || "Unnamed Project");

  const variances = filteredProjects.map(project => {
    const totalBudget = Number(project.totalBudget || 0);
    const totalSpent = Number(project.amountSpent || 0);
    return totalBudget - totalSpent;
  });

  // กำหนดสีตามค่า: เขียว = กำไร, แดง = ขาดทุน
  const barColors = variances.map(v => v >= 0 ? "#00E396" : "#FF4560");

  const chartData = {
    series: [
      {
        name: "Budget Variance",
        data: variances,
      },
    ],
    options: {
      chart: {
        type: "bar",
        height: 350,
        stacked: false,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
        },
      },
      colors: barColors, // ✅ ใช้ array ของสีตรงนี้
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories,
        title: {
          text: "Projects",
        },
      },
      yaxis: {
        title: {
          text: "Amount ($)",
        },
        labels: {
          formatter: (value: number) =>
            value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) =>
            `$${value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
        },
      },
      legend: {
        show: false, // ซ่อน legend เพราะมีแค่ series เดียว
      },
    },
  };

  return (
    <div>
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="bar"
        height={350}
      />
    </div>
  );
};



const ProjectCompletionRate = ({ completionRate }: { completionRate: number }) => {
  const [state] = useState({
    series: [completionRate],
    options: {
      chart: { height: 350, type: "radialBar" },
      plotOptions: {
        radialBar: {
          hollow: { size: "70%" },
          dataLabels: {
            name: {
              show: true,
              fontSize: '12px',
            },
            value: {
              show: true,
              formatter: (val: number) => `${val.toFixed(2)}%`, // แสดงค่าเป็นเปอร์เซ็นต์
            },
          },
        },
      },
      labels: ["Project Completion Rate"],
    },
  });

  return (
    <div>
      <ReactApexChart options={state.options} series={state.series} type="radialBar" height={230} />
    </div>
  );
};

const UtilizedDuration = ({ utilizedDays }: { utilizedDays: number }) => {
  const [state] = useState({
    series: [utilizedDays],
    options: {
      chart: { height: 350, type: "radialBar" },
      plotOptions: {
        radialBar: {
          hollow: { size: "70%" },
          dataLabels: {
            name: { show: true },
            value: {
              show: true,
              formatter: () => `${utilizedDays} day(s)`, // แสดงจำนวนวัน
            },
          },
        },
      },
      labels: ["Utilized Duration"],
    },
  });

  return (
    <div>
      <ReactApexChart options={state.options} series={state.series} type="radialBar" height={230} />
    </div>
  );
};

const CostBreakdown = ({ filteredProjects }: { filteredProjects: TypeDashboard[] | null }) => {
  const [state, setState] = useState<{
    series: number[];
    options: {
      chart: { type: string };
      labels: string[];
      responsive: { breakpoint: number; options: { chart: { width: number }; legend: { position: string } } }[];
    };
  }>({
    series: [],
    options: {
      chart: { type: "donut" },
      labels: [],
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: "bottom" } } }],
    },
  });

  useEffect(() => {
    if (filteredProjects && filteredProjects.length > 0) {
      const labels = filteredProjects.map((project) => project.project_name || "Unnamed Project");
      const series = filteredProjects.map((project) => Number(project.amountSpent) || 0);

      // ใช้ชุดสีแบบขยายเพื่อให้ไม่ซ้ำง่าย
      const colorPalette = [
        "#FF4560", "#008FFB", "#00E396", "#FEB019", "#775DD0",
        "#3F51B5", "#F44336", "#4CAF50", "#9C27B0", "#FF9800",
        "#607D8B", "#E91E63", "#00BCD4", "#CDDC39", "#8BC34A",
        "#FF5722", "#795548", "#FFC107", "#03A9F4", "#673AB7"
      ];

      // ตัดเฉพาะจำนวนสีที่ตรงกับจำนวนโปรเจ็ก
      const colors = colorPalette.slice(0, labels.length);

      setState((prevState) => ({
        ...prevState,
        series,
        options: {
          ...prevState.options,
          labels,
          colors,
          dataLabels: {
            formatter: (val: number) => val.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          },
          tooltip: {
            y: {
              formatter: (val: number) => val.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            },
          },
        },
      }));
    } else {
      setState((prevState) => ({
        ...prevState,
        series: [],
        options: {
          ...prevState.options,
          labels: [],
          colors: [],
        },
      }));
    }
  }, [filteredProjects]);

  return (
    <div>
      {state.series.length > 0 && state.series.some((value) => value > 0) ? (
        <ReactApexChart options={state.options} series={state.series} type="donut" />
      ) : (
        <p>No data available or all values are zero</p>
      )}
    </div>
  );
};


export { BudgetVariance, ProjectCompletionRate, UtilizedDuration, CostBreakdown, };

//--------------------------------------------------------------------------------------------------------------------------------------//

const calculateEAC = (projects: TypeDashboard[] | null) => {
  if (!projects || projects.length === 0) return null;

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0); // BAC
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.amountSpent || 0), 0); // AC
  const totalProgress = projects.reduce((sum, project) => sum + (project.completionRate || 0), 0) / projects.length; // % Progress

  const earnedValue = (totalProgress / 100) * totalBudget; // EV
  const costPerformanceIndex = earnedValue / totalAmountSpent; // CPI

  // ใช้สูตร EAC = BAC / CPI
  const eac = costPerformanceIndex > 0 ? totalBudget / costPerformanceIndex : totalBudget;

  return eac;
};
//========================================================================================
const calculatePercentOfTarget = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const today = new Date();

  const totalPercent = projects.reduce((sum, project) => {
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);

    const projectDuration = Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // ระยะเวลาทั้งหมด (วัน)
    const utilizedDuration = Math.max(0, (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // ระยะเวลาที่ใช้ไปแล้ว (วัน)

    const percentTarget = projectDuration > 0 ? (utilizedDuration / projectDuration) * 100 : 0;

    return sum + percentTarget;
  }, 0);

  return totalPercent / projects.length; // ค่าเฉลี่ย Percent of Target
};
//========================================================================================


const CustomSelect = ({
  options,
  placeholder,
  onChange,
  selectedOptions,
}: {
  options: string[];
  placeholder: string;
  onChange: (value: string[]) => void;
  selectedOptions: string[];
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCheckboxChange = (option: string) => {
    let updatedOptions: string[];

    if (option === "All") {
      updatedOptions = selectedOptions.includes("All")
        ? [] // ยกเลิกการเลือกทั้งหมด
        : [...options]; // เลือกทั้งหมด
    } else {
      updatedOptions = selectedOptions.includes(option)
        ? selectedOptions.filter((item) => item !== option) // เอาออกถ้าเลือกซ้ำ
        : [...selectedOptions.filter((item) => item !== "All"), option]; // เพิ่มตัวเลือกใหม่และเอา All ออก
    }

    onChange(updatedOptions); // ส่งค่าที่เลือกกลับไปยัง Dashboard
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <div ref={dropdownRef} className="relative w-full border rounded p-2 mb-2">
      <div
        className="cursor-pointer"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {selectedOptions.length > 0
          ? selectedOptions.join(", ") // แสดงตัวเลือกที่เลือก
          : placeholder}
      </div>
      {isDropdownOpen && (
        <div className="absolute bg-white border rounded mt-2 w-full z-10">
          {options.map((option) => (
            <div key={option} className="flex items-center mb-2 p-2 hover:bg-teal-100 cursor-pointer">
              <input
                type="checkbox"
                id={option}
                name={option}
                value={option}
                checked={selectedOptions.includes(option)} // แสดงสถานะติ๊กถูก
                onChange={() => handleCheckboxChange(option)}
                className="mr-2"
              />
              <label htmlFor={option} className="text-lg">
                {option}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const calculateBudgetVariance = (projects: TypeDashboard[] | null) => { //ฟังก์ชันสำหรับคำนวณ Budget Variance
  if (!projects || projects.length === 0) return { variance: 0, variancePercentage: 0 }; // ตรวจสอบว่า projects มีข้อมูลหรือไม่

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget || 0), 0);
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.amountSpent || 0), 0);

  if (totalBudget === 0) {
    console.warn("Total budget is zero, cannot calculate variance percentage.");
  }

  const variance = totalBudget - totalAmountSpent;
  const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

  return { variance, variancePercentage };
};


const calculateAggregatedValues = (projects: TypeDashboard[]) => {
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.totalBudget), 0);
  const totalAmountSpent = projects.reduce((sum, project) => sum + Number(project.amountSpent), 0);
  const percentTarget = totalBudget > 0 ? (totalAmountSpent / totalBudget) * 100 : 0;

  return {
    totalBudget,
    totalAmountSpent,
    percentTarget,
  };
};



const calculateCompletionRate = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const totalCompletion = projects.reduce((sum, project) => sum + (project.completionRate || 0), 0);
  return totalCompletion / projects.length; // ค่าเฉลี่ยของ Completion Rate
};

// ฟังก์ชันสำหรับคำนวณ Utilized Duration
const calculateUtilizedDuration = (projects: TypeDashboard[] | null): number => {
  if (!projects || projects.length === 0) return 0;

  const today = new Date();
  const totalDays = projects.reduce((sum, project) => {
    const startDate = new Date(project.start_date);
    const duration = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))); // คำนวณจำนวนวัน
    return sum + duration;
  }, 0);

  console.log("Utilized Duration (days):", totalDays); // Debugging
  return totalDays;
};


const Dashboard = () => {
  const [projectDetails, setProjectDetails] = useState<TypeDashboard[] | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<TypeDashboard[] | null>(null);
  const [projectOptions, setProjectOptions] = useState<string[]>(["All"]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(["All"]); // เก็บโปรเจ็กต์ที่เลือก
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["All"]); // เก็บสถานะที่เลือก
  const [loading, setLoading] = useState(true);

  // คำนวณ Budget Variance
  const budgetVariance = calculateBudgetVariance(filteredProjects);

  // คำนวณ Completion Rate
  const completionRate = filteredProjects
    ? calculateCompletionRate(filteredProjects)
    : 0;

  // คำนวณ Utilized Duration
  const utilizedDays = calculateUtilizedDuration(filteredProjects);

  const percentOfTarget = filteredProjects
    ? calculatePercentOfTarget(filteredProjects)
    : 0;

  // ฟังก์ชันสำหรับคำนวณค่าใช้จ่ายรวม
  const aggregatedValues = projectDetails
    ? calculateAggregatedValues(
      selectedProjects.includes("All")
        ? projectDetails
        : projectDetails.filter((project) =>
          selectedProjects.includes(project.project_name)
        )
    )
    : null;

  // ดึงข้อมูลจาก API เมื่อ Component ถูกโหลด
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const data = await getDashboard();
        console.log("API Response:", data);

        if (Array.isArray(data.responseObject) && data.responseObject.length > 0) {
          setProjectDetails(data.responseObject);
          setFilteredProjects(data.responseObject);

          // สร้าง projectOptions จากข้อมูลจริง
          const options = ["All", ...data.responseObject.map((project) => project.project_name)];
          setProjectOptions(options);

          // อัปเดต selectedProjects ให้เลือกทั้งหมดโดยค่าเริ่มต้น
          setSelectedProjects(["All"]);
        } else {
          console.error("responseObject is not an array or is empty");
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, []);

  // ฟังก์ชันสำหรับกรองข้อมูล
  useEffect(() => {
    if (projectDetails) {
      const filtered = projectDetails.filter((project) => {
        const matchesProject =
          selectedProjects.includes("All") || selectedProjects.includes(project.project_name);
        const matchesStatus =
          selectedStatuses.includes("All") || selectedStatuses.includes(project.status);

        return matchesProject && matchesStatus; // กรองข้อมูลที่ตรงกับทั้ง Project และ Status
      });

      console.log("Filtered Projects:", filtered); // Debugging
      setFilteredProjects(filtered.length > 0 ? filtered : null);
    }
  }, [selectedProjects, selectedStatuses, projectDetails]);


  return (
    <div className="min-h-screen bg-gray-400 p-3">
      <div className="container mx-auto">
        {/* Project Filter Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-4 border border-gray-300">
          <h2 className="text-xl font-semibold mb-4">Filter Projects</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Projects</h3>
              <CustomSelect
                options={projectOptions}
                placeholder="Select Projects"
                selectedOptions={selectedProjects} // ส่งค่าที่เลือก
                onChange={(value) => setSelectedProjects(value)} // อัปเดต selectedProjects
              />
            </div>
            <div className="p-4 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Project Status</h3>
              <CustomSelect
                options={["All", "In progress", "Completed", "Suspend operations", "Project Cancellation"]}
                placeholder="Select Status"
                selectedOptions={selectedStatuses} // ส่งค่าที่เลือก
                onChange={(value) => setSelectedStatuses(value)} // อัปเดต selectedStatuses
              />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-3 gap-3">
          {/* Project Details */}
          <div className="bg-white shadow-lg rounded-lg p-2 border border-gray-200">
            <div className=" bg-indigo-200 shadow-lg rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold pl-2 mt-2 ">Project Details</h2>
              <div
                className="space-y-3 p-4 mt-4 bg-indigo-100 shadow-lg rounded-lg border border-gray-200 overflow-y-auto"
                style={{
                  minHeight: "280px",
                  maxHeight: "280px",
                }}
              >
                {loading ? (
                  <p>Loading...</p>
                ) : filteredProjects && filteredProjects.length > 0 ? (
                  filteredProjects.map((project, index) => (
                    <div
                      key={project.project_id}
                      className={`mb-4 ${index !== filteredProjects.length - 1 ? "border-b border-emerald-700 pb-4" : ""}`}
                    >
                      <p className="text-lg">
                        <strong>Project Name:</strong> {project.project_name}
                      </p>
                      <p className="text-lg">
                        <strong>Start Date:</strong> {new Date(project.start_date).toLocaleDateString()}
                      </p>
                      <p className="text-lg">
                        <strong>Finish Date:</strong> {new Date(project.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-lg">
                        <strong>Status:</strong> {project.status}
                      </p>
                      <p className="text-lg">
                        <strong>Actual Cost:</strong> ${Number(project.actual).toLocaleString()}
                      </p>
                      <p className="text-lg">
                        <strong>Budget:</strong> ${Number(project.budget).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No selected projects.</p>
                )}
              </div>
            </div>


            {/* Budget Summary */}
            <div className="mt-3 bg-white shadow-lg rounded-lg border border-gray-200">
              <div className="p-1">
                <div className="grid rounded-lg shadow-lg bg-blue-300">
                  <h2 className="text-center font-semibold text-l mt-6 mb-4">Estimate At Completion</h2>
                  <h2 className="text-center font-semibold text-4xl mt-2 mb-6">
                    {filteredProjects
                      ? `$${calculateEAC(filteredProjects)?.toLocaleString() || "N/A"}`
                      : "Loading..."}
                  </h2>
                </div>
              </div>
              <div className=" p-1 mt-1">
                <div className="grid p-4 rounded-lg shadow-lg bg-indigo-400">
                  <h2 className="text-center font-semibold text-4xl mt-2">
                    {percentOfTarget.toFixed(2)}%
                  </h2>
                  <h2 className="text-center font-semibold text-l mt-4">Percent Of Target</h2>
                  <div className="flex justify-between w-full text-center mt-5">
                    <div className="w-1/2 pr-2">
                      {aggregatedValues
                        ? `${aggregatedValues.percentTarget.toFixed(2)}%`
                        : filteredProjects && filteredProjects.length > 0
                          ? `${(
                            (filteredProjects[0].amountSpent / filteredProjects[0].totalBudget) *
                            100
                          ).toFixed(2)}%`
                          : "Loading..."}
                      <h2 className="text-center font-semibold mt-1">Amount Spent</h2>
                    </div>
                    <div className="w-1/2 border-l-2 border-black pl-2">
                      {aggregatedValues
                        ? `$${aggregatedValues.totalBudget.toLocaleString()}`
                        : filteredProjects && filteredProjects.length > 0
                          ? `$${filteredProjects[0].totalBudget.toLocaleString()}`
                          : "Loading..."}
                      <h2 className="text-center font-semibold mt-1">Total Budget</h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div >

          {/* Cost Breakdown */}
          < div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200" >
            <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>
            <CostBreakdown filteredProjects={filteredProjects} />
            <div className="grid grid-cols-2 gap-2 p-2 mt-4 text-center ">
              <div className="border p-2">Equipment</div>
              <div className="border p-2 bg-green-300 ">$159,801</div>
              <div className="border p-2">Foreign Labor</div>
              <div className="border p-2 bg-blue-400">$134,568</div>
              <div className="border p-2">Labor</div>
              <div className="border p-2 bg-purple-500">$157,986</div>
              <div className="border p-2">Material</div>
              <div className="border p-2 bg-red-500">$161,837</div>
              <div className="border p-2">Subcontractors</div>
              <div className="border p-2 bg-orange-400">$151,775</div>
            </div>
          </div >

          {/* Charts Section */}
          < div className="grid bg-white shadow-lg rounded-lg p-6 border border-gray-200" >
            <div className="grid gap-2 ">
              <div className="bg-white shadow-md rounded-lg border border-gray-200 ">
                <div className="text-sm font-semibold p-1 mt-2 pl-4 ">Project Completion Rate</div>
                <ProjectCompletionRate completionRate={completionRate} />
              </div>
              <div className="bg-white shadow-md rounded-lg border border-gray-200 ">
                <div className="text-sm font-semibold p-1 mt-2 pl-4">Utilized Duration</div>
                <UtilizedDuration utilizedDays={utilizedDays} />
              </div>
            </div>
          </div >
        </div >
        <div >

          {/* Budget Variance Chart */}
          <div className="bg-white shadow-lg rounded-lg p-6 mt-4 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Budget Variance</h2>
            <div className=" mt-8">
              <BudgetVariance filteredProjects={filteredProjects} />
            </div>
          </div>

        </div>
      </div >
    </div >
  );
};

export default Dashboard;