import React from 'react';

/**
 * Component ProgressBar สำหรับแสดงความคืบหน้า
 */
export const ProgressBar = ({ percent }: { percent: number }) => {
    // กำหนดสีตามเปอร์เซ็นต์
    const getColor = () => {
        if (percent < 25) return "#ef4444"; // แดง
        if (percent < 50) return "#f97316"; // ส้ม 
        if (percent < 75) return "#facc15"; // เหลือง
        return "#22c55e"; // เขียว
    };

    // แสดงค่าเปอร์เซ็นต์เป็นทศนิยม 2 ตำแหน่ง
    const formattedPercent = percent.toFixed(2);

    return (
        <div>
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>{formattedPercent}%</div>
            <div
                style={{
                    width: "100%",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    height: "8px",
                }}
            >
                <div
                    style={{
                        width: `${percent}%`,
                        backgroundColor: getColor(),
                        height: "100%",
                        borderRadius: "4px",
                        transition: "width 0.3s ease-in-out",
                    }}
                />
            </div>
        </div>
    );
};

/**
 * Component แสดงสถานะการโหลด
 */
export const LoadingIndicator = ({ message = "Loading..." }: { message?: string }) => {
    return (
        <div className="flex items-center justify-center py-4">
            <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <div className="mt-2">{message}</div>
            </div>
        </div>
    );
};