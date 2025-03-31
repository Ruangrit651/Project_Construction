import React from "react";
import { Table } from "@radix-ui/themes";

interface SubtaskRowProps {
    subtaskName: string;
    startDate: string | undefined;
    endDate: string | undefined;
    status: string;
    startCol: number;
    span: number;
}

const SubtaskRow: React.FC<SubtaskRowProps> = ({ subtaskName, startDate, endDate, status, startCol, span }) => {
    return (
        <>
            <Table.Cell className="pl-8 border-r-2 border-gray-300">{status}</Table.Cell>
            {Array.from({ length: 12 }).map((_, monthIndex) => {
                const isStart = monthIndex + 1 === startCol;
                return (
                    <Table.Cell key={monthIndex} className="relative group">
                        {isStart && (
                            <div
                                className="absolute h-3 top-1/2 transform -translate-y-1/2 rounded bg-green-500 group-hover:bg-green-600 transition-all duration-300"
                                style={{
                                    left: 0,
                                    width: `calc(${span} * 100%)`,
                                }}
                            >
                                {/* Hover Tooltip */}
                                <div className="hidden group-hover:block absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-2 text-xs bg-gray-700 text-white rounded shadow w-64">
                                    {subtaskName}
                                    <br />
                                    {startDate} - {endDate}
                                    <br />
                                    Status: {status}
                                </div>
                            </div>
                        )}
                    </Table.Cell>
                );
            })}
        </>
    );
};

export default SubtaskRow;