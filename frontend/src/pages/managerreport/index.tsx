import React, { useState } from "react";
import BudgetOverview from "./components/budgetOverview";

// คือข้อมูลตัวอย่างที่ใช้ในการทดสอบ 
const mockData = {
  totalBudget: 1000000,
  amountSpent: 450000,
  remainingBudget: 550000,
  resources: [
    { type: "Equipment", quantity: 10, totalCost: 200000 },
    { type: "Material", quantity: 50, totalCost: 150000 },
    { type: "Worker", quantity: 20, totalCost: 100000 },
  ],
  projectStart: "2025-03-01", // เริ่มโครงการ
  projectEnd: "2025-07-31",   // สิ้นสุดโครงการ
};


// คือคอมโพเนนต์หลักของหน้า Report
export default function Report() {
  const [view, setView] = useState<string>("");

  const handleViewReport = (type: string) => { // ฟังก์ชันที่ใช้ในการเปลี่ยนมุมมองของ Report
    setView(type);
  };

  return (
    <div className=" items-start justify-start h-screen  bg-gray-100">
      <div className="text-2xl font-bold mb-10 mt-5 ml-5">
        <h1 >Document Report</h1>
      </div>

      {view === "Budget/Resource" ? ( // ถ้าหาก view เป็น "Budget/Resource" ให้แสดงคอมโพเนนต์ BudgetOverview
        <BudgetOverview {...mockData} /> // ส่งข้อมูลตัวอย่างไปยังคอมโพเนนต์ BudgetOverview
      ) : (

        <div className="grid  md:grid-cols-2 gap-10 mx-8 ml-20 mr-20">
          {/* Budget/Resource Button */}
          <button
            className="flex flex-col items-center justify-center p-6 border rounded-xl bg-white hover:shadow-md hover:-translate-y-1 transition-transform duration-200 ease-in-out"
            onClick={() => handleViewReport("Budget/Resource")}
          >
            <img
              src="https://png.pngtree.com/png-vector/20230428/ourmid/pngtree-budget-line-icon-vector-png-image_6738514.png"
              alt="Budget/Resource Icon"
              className="w-16 h-16 mb-4"
            />
            <h2 className="text-base font-semibold text-gray-800">Budget/Resource</h2>
          </button>

          {/* Planning Button */}
          <button
            className="flex flex-col items-center justify-center p-6 border rounded-xl bg-white hover:shadow-md hover:-translate-y-1 transition-transform duration-200 ease-in-out"
            onClick={() => handleViewReport("Planning")}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/11319/11319783.png"
              alt="Planning Icon"
              className="w-16 h-16 mb-4"
            />
            <h2 className="text-base font-semibold text-gray-800">Planning</h2>
          </button>
        </div>
      )}
    </div>
  );
}