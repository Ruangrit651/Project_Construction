import React from "react";

interface ReportCardProps {
  title: string;
  description: string;
  onViewReport: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, onViewReport }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button
        className="bg-gray-200 hover:bg-gray-300 text-sm font-medium py-1 px-4 rounded"
        onClick={onViewReport}
      >
        View Report
      </button>
    </div>
  );
};

export default ReportCard;
