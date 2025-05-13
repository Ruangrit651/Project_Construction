import React from "react";

interface Resource {
  type: string;
  quantity: number;
  totalCost: number;
}

interface BudgetOverviewProps {
  totalBudget: number;
  amountSpent: number;
  remainingBudget: number;
  resources: Resource[];
  projectStart: string; // ISO Date string
  projectEnd: string;   // ISO Date string
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  totalBudget,
  amountSpent,
  remainingBudget,
  resources,
  projectStart,
  projectEnd,
}) => {
  const spentPercentage = (amountSpent / totalBudget) * 100;

  const now = new Date();
  const startDate = new Date(projectStart);
  const endDate = new Date(projectEnd);

  const totalDuration = endDate.getTime() - startDate.getTime();
  const timeElapsed = Math.min(now.getTime() - startDate.getTime(), totalDuration); // ไม่ให้เกิน 100%
  const timeUsagePercentage = (timeElapsed / totalDuration) * 100;

  return (
    <div className=" p-4 bg-white rounded-2xl shadow-xl  ">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-2 ">
        📊 Budget & Resource Overview
      </h1>

      {/* Budget Summary */}
      <div className="mb-10 ">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">💰 Budget Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-lg pr-12 pl-12">
          <div className="bg-blue-100 p-4 rounded-lg shadow-xl">
            <p className="text-gray-800 text-sm mb-3 ">Total Budget</p>
            <p className="font-bold text-green-700 text-center text-2xl">{totalBudget.toLocaleString()} THB</p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow-xl">
            <p className="text-gray-800 text-sm mb-3">Amount Spent</p>
            <p className="font-bold text-green-700 text-center text-2xl">{amountSpent.toLocaleString()} THB</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow-xl">
            <p className="text-gray-800 text-sm mb-3">Remaining Budget</p>
            <p className="font-bold text-green-700 text-center text-2xl">{remainingBudget.toLocaleString()} THB</p>
          </div>
        </div>

        {/* Budget Usage แสดง เปอร์เซ็นต์ของงบประมาณที่ถูกใช้ไปแล้ว จากงบประมาณทั้งหมดของโครงการ */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg p-3 shadow-xl ">
          <div>
            <p className="text-gray-700 mb-1 font-medium p-3">📈 Budget Usage</p>
            <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden mb-4  ">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-green-400 text-xs text-white flex items-center justify-end pr-2 rounded-full transition-all"
                style={{ width: `${spentPercentage}%` }}
              >
                {spentPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* เวลาของโครงการผ่านไปแล้วกี่เปอร์เซ็นต์จากทั้งหมด */}
          <div>
            <p className="text-gray-700 mb-1 font-medium p-3">⏳ Time Usage</p>
            <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden mb-2  ">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 text-xs text-white flex items-center justify-end pr-2 rounded-full transition-all"
                style={{ width: `${timeUsagePercentage}%` }}
              >
                {timeUsagePercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

    
      {/* Resource Table */}
      <div className="mt-10 rounded-lg shadow-xl p-4 ">
        <h2 className="text-2xl font-semibold text-indigo-900 mb-4">🛠️ Resource Allocation</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse bg-white shadow-xl rounded-xl">
            <thead>
              <tr className="bg-blue-50 text-gray-700 text-md uppercase tracking-wider">
                <th className="px-6 py-4 border-b text-center">🔧 Resource Type</th>
                <th className="px-6 py-4 border-b text-center">📦 Quantity</th>
                <th className="px-6 py-4 border-b text-center">💵 Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition`}
                >
                  <td className="px-6 py-4 border-b text-center font-medium text-gray-800">
                    {resource.type}
                  </td>
                  <td className="px-6 py-4 border-b text-center text-blue-700 font-semibold">
                    {resource.quantity}
                  </td>
                  <td className="px-6 py-4 border-b text-center text-green-700 font-semibold">
                    {resource.totalCost.toLocaleString()} THB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default BudgetOverview;
