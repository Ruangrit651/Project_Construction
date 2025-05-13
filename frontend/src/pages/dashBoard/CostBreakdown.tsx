import React, { useState, useEffect } from "react";

// Define the TypeDashboard type
type TypeDashboard = {
  project_name?: string;
  amountSpent?: number;
};
import ReactApexChart from "react-apexcharts";

// ฟังก์ชันสำหรับคำนวณ Cost Breakdown
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

export default CostBreakdown;