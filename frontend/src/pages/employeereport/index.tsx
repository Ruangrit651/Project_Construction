import ReportCard from "./components/ReportCard";

export default function EmployeeReport() {
  const handleViewReport = (type: string) => {
    alert(`Viewing ${type} report`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Document Report</h1>
      <div className="space-y-4">
        <ReportCard
          title="Budget/Resource"
          description="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          onViewReport={() => handleViewReport("Budget/Resource")}
        />
        <ReportCard
          title="Planning"
          description="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          onViewReport={() => handleViewReport("Planning")}
        />
      </div>
    </div>
  );
}
