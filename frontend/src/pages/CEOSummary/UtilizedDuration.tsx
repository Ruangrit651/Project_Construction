import React from "react";
import ReactApexChart from "react-apexcharts";

const UtilizedDuration = ({ utilizedDays }: { utilizedDays: number }) => {
  const chartData = {
    series: [utilizedDays],
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
              formatter: () => `${utilizedDays} day(s)`,
            },
            total: {
              show: true,
              label: "Target",
              formatter: () => "?",
            },
          },
        },
      },
      colors: ["#FACC15"],
      labels: ["Utilized Duration"],
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

export default UtilizedDuration;