import React from "react";
import { Table, Text } from "@radix-ui/themes";

interface DateTableProps {
    taskType: string;
    year: number;
}

const DateTable: React.FC<DateTableProps> = ({ taskType, year }) => {
    // Generate months and days for the selected year
    const months = Array.from({ length: 12 }, (_, index) => ({
        name: new Date(year, index).toLocaleString("default", { month: "short" }),
        days: new Date(year, index + 1, 0).getDate(),
    }));

    return (
        <Table.Root variant="surface" className="min-w-[1200px]">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell className="w-[180px]">Task Type</Table.ColumnHeaderCell>
                    {months.map((month, index) => (
                        <Table.ColumnHeaderCell
                            key={index}
                            colSpan={month.days}
                            className={`text-center bg-gray-100 ${index < months.length - 1 ? "border-r border-gray-300" : ""}`}
                        >
                            <Text size="2">{month.name}</Text>
                        </Table.ColumnHeaderCell>
                    ))}
                </Table.Row>
                <Table.Row>
                    <Table.ColumnHeaderCell className="w-[180px]"></Table.ColumnHeaderCell>
                    {months.map((month, index) =>
                        Array.from({ length: month.days }, (_, dayIndex) => (
                            <Table.ColumnHeaderCell
                                key={`${index}-${dayIndex}`}
                                className={`text-center bg-gray-50 ${dayIndex === month.days - 1 && index < months.length - 1 ? "border-r border-gray-300" : ""}`}
                            >
                                <Text size="1">{dayIndex + 1}</Text>
                            </Table.ColumnHeaderCell>
                        ))
                    )}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    <Table.Cell className="font-bold">{taskType}</Table.Cell>
                    {months.map((month, index) =>
                        Array.from({ length: month.days }, (_, dayIndex) => (
                            <Table.Cell
                                key={`${index}-${dayIndex}`}
                                className={`text-center ${dayIndex === month.days - 1 && index < months.length - 1 ? "border-r border-gray-300" : ""}`}
                            >
                                {/* Add your data here */}
                            </Table.Cell>
                        ))
                    )}
                </Table.Row>
            </Table.Body>
        </Table.Root>
    );
};

export default DateTable;