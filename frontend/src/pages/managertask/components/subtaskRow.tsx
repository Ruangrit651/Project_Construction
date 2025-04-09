import React from "react";
import { Table, Text } from "@radix-ui/themes";


interface SubtaskRowProps {
  subtask: any; // Replace `any` with the appropriate Subtask type
  fetchSubtasks: () => void;
}

export const formatDate = (dateString: string): string => {
    const [day, month, year] = dateString.split("/").map(Number);
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year + 2000}`;
  };

const SubtaskRow: React.FC<SubtaskRowProps> = ({ subtask, fetchSubtasks }) => {
  return (
    <Table.Row className="bg-gray-50">
      <Table.Cell className="pl-8 w-[250px] bg-yellow-200">
        <Text className="cursor-pointer hover:text-blue-600 hover:underline">
          {subtask.subtaskName}
        </Text>
      </Table.Cell>
      <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(subtask.startDate)}</Table.Cell>
      <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(subtask.endDate)}</Table.Cell>
      <Table.Cell className="w-[100px] bg-yellow-200 border-r-2 border-gray-300">
        {subtask.status}
      </Table.Cell>
    </Table.Row>
  );
};

export default SubtaskRow;