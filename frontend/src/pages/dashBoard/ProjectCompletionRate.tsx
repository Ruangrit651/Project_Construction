import React from "react";
import ReactApexChart from "react-apexcharts";

const getColor = (value: number) => {
  if (value >= 75) return "#00E396"; // Green
  if (value >= 50) return "#FEB019"; // Yellow
  return "#FF4560"; // Red
};

const ProjectCompletionRate = ({ completionRate }: { completionRate: number }) => {
  const chartData = {
    series: [completionRate],
    options: {
      chart: {
        type: "radialBar",
        height: 350,
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
        },
      },
      plotOptions: {
        radialBar: {
          hollow: { size: "70%" },
          dataLabels: {
            name: { show: true },
            value: {
              show: true,
              formatter: (val: number) => `${val.toFixed(2)}%`,
            },
            total: {
              show: true,
              label: "Target",
              formatter: () => "100%",
            },
          },
        },
      },
      colors: [getColor(completionRate)],
      labels: ["Project Completion Rate"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: { height: 200 },
          },
        },
      ],
    },
  };

  return (
    <ReactApexChart
      options={chartData.options}
      series={chartData.series}
      type="radialBar"
      height={230}
    />
  );
};

export default ProjectCompletionRate;