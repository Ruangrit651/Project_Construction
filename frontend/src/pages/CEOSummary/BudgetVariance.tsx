import React, { useRef } from "react";
import ReactApexChart from "react-apexcharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { TypeDashboard } from "@/types/response/response.dashboard";

const BudgetVariance = ({ filteredProjects }: { filteredProjects: TypeDashboard[] | null }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  if (!filteredProjects || filteredProjects.length === 0) {
    return <p>No data available</p>;
  }

  const categories = filteredProjects.map((project) => project.project_name || "Unnamed Project");
  const variances = filteredProjects.map((project) => {
    const totalBudget = Number(project.totalBudget || 0);
    // ใช้ actual แทน amountSpent
    const totalSpent = Number(project.actual || project.amountSpent || 0);
    return totalBudget - totalSpent;
  });

  const handleExport = async (type: "png" | "pdf" | "excel") => {
    if (!chartRef.current) return;

    if (type === "png" || type === "pdf") {
      const canvas = await html2canvas(chartRef.current);
      const imageData = canvas.toDataURL("image/png");

      if (type === "png") {
        const link = document.createElement("a");
        link.href = imageData;
        link.download = "chart.png";
        link.click();
      } else if (type === "pdf") {
        const pdf = new jsPDF("landscape", "mm", "a4");
        const imgProps = pdf.getImageProperties(imageData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imageData, "PNG", 10, 10, pdfWidth - 20, pdfHeight);
        pdf.save("chart.pdf");
      }
    }

    if (type === "excel") {
      const data = filteredProjects?.map((p) => ({
        Project: p.project_name,
        Budget: Number(p.totalBudget || 0),
        Spent: Number(p.amountSpent || 0),
        Variance: Number(p.totalBudget || 0) - Number(p.amountSpent || 0),
      }));
      const worksheet = XLSX.utils.json_to_sheet(data || []);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Variance");
      XLSX.writeFile(workbook, "chart-data.xlsx");
    }
  };

  const chartData = {
    series: [
      {
        name: "Budget Variance",
        data: variances,
      },
    ],
    options: {
      chart: {
        type: "bar" as const,
        height: 350,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
          borderRadius: 8,
          dataLabels: { position: "top" },
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        style: {
          fontSize: "12px",
          fontWeight: "500",
          colors: ["#374151"],
        },
        formatter: (val: number) =>
          `${val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} THB`,
      },
      colors: variances.map((val) => (val < 0 ? "#ef4444" : "#10b981")),
      xaxis: {
        categories,
        title: { text: "Projects", style: { fontWeight: 1000 } },
        labels: { rotate: -15, style: { fontSize: "12px" } },
      },
      yaxis: {
        title: { text: "Amount (THB)", style: { fontWeight: 600 } },
        labels: {
          formatter: (value: number) =>
            value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
        },
      },
      tooltip: {
        custom: function ({ dataPointIndex }: { dataPointIndex: number }) {
          const project = filteredProjects[dataPointIndex];
          const budget = Number(project.totalBudget || 0);
          const spent = Number(project.amountSpent || 0);
          const variance = budget - spent;
          const isOver = variance < 0;

          return `
            <div style="
              display: flex;
              background: linear-gradient(145deg, #f9fafb, #ffffff);
              border: 1px solid #d1d5db;
              border-left: 5px solid ${isOver ? "#ef4444" : "#10b981"};
              border-radius: 8px;
              padding: 12px 16px;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
              font-family: 'Segoe UI', sans-serif;
              color: #1f2937;
              font-size: 13.5px;
              line-height: 1.6;
              width: max-content;
              max-width: 320px;
            ">
              <div>
                <div style="font-weight: 600; font-size: 14.5px; margin-bottom: 8px; color: #111827;">
                  📌 ${project.project_name}
                </div>
                <div><span style="color:#6b7280;">💰 Budget:</span> <span style="font-family: monospace;">${budget.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span></div>
                <div><span style="color:#6b7280;">💸 Spent:</span> <span style="font-family: monospace;">${spent.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span></div>
                <div><span style="color:#6b7280;">📊 Variance:</span> <span style="font-family: monospace; font-weight: bold; color: ${isOver ? "#ef4444" : "#10b981"};">${variance.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span></div>
              </div>
            </div>
          `;
        },
      },
    },
  };

  return (
    <div>
      {/* Export Button Dropdown */}
      <div className="flex justify-end mb-4">
        <div className="relative inline-block text-left">
          {/* <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() =>
              document.getElementById("export-menu")?.classList.toggle("hidden")
            }
          >
            📤 Export
          </button> */}
          <div
            id="export-menu"
            className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg hidden z-10"
          >
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => handleExport("png")}>
              🖼️ PNG
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => handleExport("pdf")}>
              📄 PDF
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => handleExport("excel")}>
              📊 Excel
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div ref={chartRef}>
        <ReactApexChart
          options={chartData.options}
          series={chartData.series}
          type="bar"
          height={350}
        />
      </div>
    </div>
  );
};

export default BudgetVariance;
