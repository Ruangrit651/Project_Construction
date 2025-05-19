import React from "react";
import ReactApexChart from "react-apexcharts";

const BudgetSummaryEAC = ({ actualBudget, estimatedEAC }: { actualBudget: number, estimatedEAC: number }) => {
  const chartOptions = {
    chart: { type: 'bar', height: 250 },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 8,
      },
    },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Budget Comparison'] },
    colors: ['#3b82f6', '#10b981'],
    legend: {
      position: 'top',
      horizontalAlign: 'center',
    },
    tooltip: {
      y: {  
        formatter: (val: number) => `${val.toLocaleString()} THB`,
      },
    },
  };

  const series = [
    {
      name: 'Original Budget',
      data: [actualBudget],
    },
    {
      name: 'Estimate At Completion (EAC)',
      data: [estimatedEAC],
    },
  ];

  return <ReactApexChart options={chartOptions} series={series} type="bar" height={250} />;
};

export default BudgetSummaryEAC;
