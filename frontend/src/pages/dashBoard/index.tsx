import React, { useState, useEffect, useRef } from "react";
import ReactApexChart from "react-apexcharts";

const BudgetVariance = () => {
  const [state] = useState({
    series: [
      {
        name: "Website Blog",
        type: "column",
        data: [440, 505, 414, 671, 227, 413, 201, 352, 752, 320, 257, 160],
      },
      {
        name: "Social Media",
        type: "line" as "line",
        data: [23, 42, 35, 27, 43, 22, 17, 31, 22, 22, 12, 16],
      },
    ],
    options: {
      chart: {
        height: 350,
        type: "line",
      },
      stroke: {
        width: [0, 4],
      },
      title: {
        text: "Budget Variance",
      },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [1],
      },
      labels: [
        "01 Jan 2001", "02 Jan 2001", "03 Jan 2001", "04 Jan 2001", "05 Jan 2001",
        "06 Jan 2001", "07 Jan 2001", "08 Jan 2001", "09 Jan 2001", "10 Jan 2001",
        "11 Jan 2001", "12 Jan 2001"
      ],
      yaxis: [
        { title: { text: "Website Blog" } },
        { opposite: true, title: { text: "Social Media" } },
      ],
    },
  });

  return (
    <div>
      <ReactApexChart options={state.options} series={state.series} type="line" height={270} />
    </div>
  );
};

const ProjectCompletionRate = () => {
  const [state] = useState({
    series: [70],
    options: {
      chart: { height: 350, type: "radialBar" },
      plotOptions: {
        radialBar: {
          hollow: { size: "70%" },
          dataLabels: {
            name: {
              show: true,
              fontSize: '12px', // Adjust the font size here
            },
            value: {
              show: true,
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

const UtilizedDuration = () => {
  const [state] = useState({
    series: [952],
    options: {
      chart: { height: 350, type: "radialBar" },
      plotOptions: {
        radialBar: {
          hollow: { size: "70%" },
          dataLabels: {
            name: { show: true },
            value: {
              show: true,
              formatter: () => "952 day(s)",
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

const CostBreakdown = () => {
  const [state] = useState({
    series: [44, 55, 41, 17, 15],
    options: {
      chart: { type: "donut" },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: "bottom" } } }],
    },
  });

  return (
    <div>
      <ReactApexChart options={state.options} series={state.series} type="donut" />
    </div>
  );
};

// const Testtttt = () => {
//   const [state, setState] = React.useState({

//     series: [
//       {
//         name: 'Q1 Budget',
//         group: 'budget',
//         color: '#80c7fd',
//         data: [44000, 55000, 41000, 67000, 22000],
//       },
//       {
//         name: 'Q1 Actual',
//         group: 'actual',
//         color: '#008FFB',
//         data: [48000, 50000, 40000, 65000, 25000],
//       },
//       {
//         name: 'Q2 Budget',
//         group: 'budget',
//         color: '#80f1cb',
//         data: [13000, 36000, 20000, 8000, 13000],
//       },
//       {
//         name: 'Q2 Actual',
//         group: 'actual',
//         color: '#00E396',
//         data: [20000, 40000, 25000, 10000, 12000],
//       },
//     ],
//     options: {
//       chart: {
//         type: 'bar',
//         height: 350,
//         stacked: true,
//       },
//       stroke: {
//         width: 1,
//         colors: ['#fff']
//       },
//       dataLabels: {
//         formatter: (val) => {
//           return val / 1000 + 'K'
//         }
//       },
//       plotOptions: {
//         bar: {
//           horizontal: true
//         }
//       },
//       xaxis: {
//         categories: [
//           'Online advertising',
//           'Sales Training',
//           'Print advertising',
//           'Catalogs',
//           'Meetings'
//         ],
//         labels: {
//           formatter: (val) => {
//             return val / 1000 + 'K'
//           }
//         }
//       },
//       fill: {
//         opacity: 1,
//       },
//       legend: {
//         position: 'top',
//         clusterGroupedSeriesOrientation: "horizontal",
//         horizontalAlign: "left"
//       }
//     },


//   });



//   return (
//     <div>
//       <div id="chart">
//         <ReactApexChart options={state.options} series={state.series} type="bar" height={350} />
//       </div>
//       <div id="html-dist"></div>
//     </div>
//   );
// }

// const domContainer = document.querySelector('#app');
// ReactDOM.render(<ApexChart />, domContainer);


// const Testt = () => {
//   const [state, setState] = React.useState({

//     series: [{
//       name: 'Net Profit',
//       data: [44, 55, 57, 56, 61, 58, 63, 60, 66]
//     }, {
//       name: 'Revenue',
//       data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
//     }, {
//       name: 'Free Cash Flow',
//       data: [35, 41, 36, 26, 45, 48, 52, 53, 41]
//     }],
//     options: {
//       chart: {
//         type: 'bar',
//         height: 350
//       },
//       plotOptions: {
//         bar: {
//           horizontal: false,
//           columnWidth: '55%',
//           borderRadius: 5,
//           borderRadiusApplication: 'end'
//         },
//       },
//       dataLabels: {
//         enabled: false
//       },
//       stroke: {
//         show: true,
//         width: 2,
//         colors: ['transparent']
//       },
//       xaxis: {
//         categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
//       },
//       yaxis: {
//         title: {
//           text: '$ (thousands)'
//         }
//       },
//       fill: {
//         opacity: 1
//       },
//       tooltip: {
//         y: {
//           formatter: function (val) {
//             return "$ " + val + " thousands"
//           }
//         }
//       }
//     },


//   });



//   return (
//     <div>
//       <div id="chart">
//         <ReactApexChart options={state.options} series={state.series} type="bar" height={350} />
//       </div>
//       <div id="html-dist"></div>
//     </div>
//   );
// }

// const domContainer = document.querySelector('#app');
// ReactDOM.render(<ApexChart />, domContainer);

export { BudgetVariance, ProjectCompletionRate, UtilizedDuration, CostBreakdown,};

//--------------------------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------------//
const CustomSelect = ({ options, placeholder }: { options: string[], placeholder: string }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCheckboxChange = (option: string) => {
    if (option === "All") {
      if (selectedOptions.length === options.length - 1) {
        setSelectedOptions([]);
      } else {
        setSelectedOptions(options.slice(1)); // Exclude "All" from the selection
      }
    } else {
      setSelectedOptions((prevSelectedOptions) =>
        prevSelectedOptions.includes(option)
          ? prevSelectedOptions.filter((item) => item !== option)
          : [...prevSelectedOptions, option]
      );
    }
  };

  const displayText = selectedOptions.length === options.length - 1 ? "All" : selectedOptions.join(", ") || placeholder;

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
      <div className="cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        {displayText}
      </div>
      {isDropdownOpen && (
        <div className="absolute bg-white border rounded mt-2 w-full z-10">
          {options.map((option) => (
            <div key={option} className="flex items-center mb-2 p-2 hover:bg-teal-100 cursor-pointer">
              {/* Checkbox for each option */}
              <input
                type="checkbox"
                id={option}
                name={option}
                value={option}
                checked={selectedOptions.includes(option) || (option === "All" && selectedOptions.length === options.length - 1)}
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

const Dashboard = () => {
  const projectOptions = ["All", "Project 1", "Project 2", "Project 3", "Project 4", "Project 5"];
  const statusOptions = ["All", "In Progress", "Completed", "On Hold"];

  return (
    <div className="min-h-screen bg-gray-400 p-3">
      <div className="container mx-auto">
        {/* Project Filter Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-4 border border-gray-300">
          <h2 className="text-xl font-semibold mb-4">Filter Projects</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Projects</h3>
              <CustomSelect options={projectOptions} placeholder="Select Projects" />
            </div>
            <div className="p-4 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Project Status</h3>
              <CustomSelect options={statusOptions} placeholder="Select Status" />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-3 gap-3">
          {/* Project Details */}
          <div className="bg-white shadow-lg rounded-lg p-2 border border-gray-200">
            <div className="space-y-3 p-4 mt-4 bg-red-100 shadow-lg rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Project Details</h2>
              <p className="text-lg"><strong>Project Name:</strong> Apartment Building</p>
              {/* <p className="text-lg"><strong>Project Type:</strong> Residential Project</p> */}
              <p className="text-lg"><strong>Start Date:</strong> 03.05.2024</p>
              <p className="text-lg"><strong>Finish Date:</strong> 06.06.2024</p>
            </div>

            {/* Budget Summary */}
            <div className="  mt-4 bg-white shadow-lg rounded-lg border border-gray-200">
              <div className=" p-1">
                <div className="grid rounded-lg shadow-lg bg-blue-300">
                  <h2 className="text-center font-semibold text-l mt-6 mb-4 ">Estimate Completion</h2>
                  <h2 className="text-center font-semibold text-4xl mt-2 mb-6">$2.42 M</h2>
                </div>
              </div>
              <div className=" p-1 mt-3">
                <div className="grid p-4 rounded-lg shadow-lg bg-indigo-400">
                  <h2 className="text-center font-semibold text-4xl mt-2">$2.42 M</h2>
                  <h2 className="text-center font-semibold text-l mt-4">Utilized Budget</h2>
                  <div className="flex justify-between w-full text-center mt-5">
                    <div className="w-1/2 pr-2">
                      <h2 className="text-center font-semibold text-l">$2.04 M</h2>
                      <h2 className="text-center font-semibold mt-1">Amount Spent</h2>
                    </div>
                    <div className="w-1/2 border-l-2 border-black pl-2">
                      <h2 className="text-center font-semibold text-l">$1.50 M</h2>
                      <h2 className="text-center font-semibold mt-1">Total Budget</h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>
            <CostBreakdown />
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
          </div>

          {/* Charts Section */}
          <div className="grid bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <div className="grid gap-2 ">
              <div className="bg-white shadow-md rounded-lg border border-gray-200 ">
                <div className="text-sm font-semibold p-1 mt-2  ">ProjectCompletionRate</div>
                <ProjectCompletionRate />
              </div>
              <div className="bg-white shadow-md rounded-lg border border-gray-200 ">
                <div className="text-sm font-semibold p-1 mt-2  ">UtilizedDuration</div>
                <UtilizedDuration />
              </div>
            </div>
          </div>
        </div>

        <div /**className="grid grid-cols-2 gap-3"**/>
          {/* Testt
          <div className="bg-white shadow-lg rounded-lg p-6 mt-4 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Testt</h2>
            <Testt />
          </div> */}

          {/* Budget Variance Chart */}
          <div className="bg-white shadow-lg rounded-lg p-6 mt-4 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Budget Variance</h2>
            <div className=" mt-8">
              <BudgetVariance />
            </div>
          </div>
        </div>

        {/* Testtttt
        <div className="bg-white shadow-lg rounded-lg p-6 mt-4 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Testtttt</h2>
          <Testtttt />
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;