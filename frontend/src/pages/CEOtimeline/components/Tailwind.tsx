import React from 'react';
import { Text } from '@radix-ui/themes';

// Timeline Container
export const TimelineContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow-sm">
        {children}
    </div>
);

// Timeline Header
export const TimelineHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-[#F4F5F7] border-b border-[#DFE1E6] px-4 py-3">
        {children}
    </div>
);

// Timeline Grid
export const TimelineGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-[300px_1fr] min-h-[600px]">
        {children}
    </div>
);

// Timeline Sidebar
export const TimelineSidebar = ({ children }: { children: React.ReactNode }) => (
    <div className="border-r border-[#DFE1E6] bg-white">
        {children}
    </div>
);

// Timeline Content
export const TimelineContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`overflow-x-auto overflow-y-hidden flex-1 border-l border-gray-200 relative ${className || ''}`} style={{ scrollBehavior: 'smooth' }}>
        {children}
    </div>
);

// และ TimelineContentInner component ให้มี position: relative
export const TimelineContentInner = ({ children }: { children: React.ReactNode }) => (
    <div className="relative" style={{ width: 'max-content', minWidth: '100%', position: 'relative' }}>
        {children}
    </div>
);

// Task Row
export const TaskRow = ({
    children,
    id,
    className,
    style
}: {
    children: React.ReactNode;
    id: string;
    className?: string;
    style?: React.CSSProperties;
}) => (
    <div
        id={id}
        className={`relative h-10 border-b border-[#DFE1E6] w-max hover:bg-[#F8F9FA] ${className || ''}`}
        style={style}
    >
        {children}
    </div>
);

// Subtask Row
export const SubtaskRow = ({
    children,
    id,
    className,
    style
}: {
    children: React.ReactNode;
    id: string;
    className?: string;
    style?: React.CSSProperties;
}) => (
    <div
        id={id}
        className={`relative h-10 border-b border-[#DFE1E6] w-max bg-[#F8F9FA] ${className || ''}`}
        style={style}
    >
        {children}
    </div>
);

// Task Bar
export const TaskBar = ({
    children,
    style,
    className,
    status,
    dragging,
    onClick,
    onMouseDown
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    status: string;
    dragging?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onMouseDown?: (e: React.MouseEvent) => void;
}) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-500';
            case 'in progress': return 'bg-blue-500';
            case 'delayed': return 'bg-red-500';
            case 'pending': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div
            className={`task-bar h-6 rounded transition-all duration-200 absolute select-none text-xs font-medium z-10 cursor-move
                ${getStatusColor(status)}
                hover:opacity-100 hover:shadow hover:z-20
                ${dragging ? 'opacity-100 shadow-md z-50' : ''}
                ${className || ''}`}
            style={{
                top: "8px",
                height: "24px",
                ...style
            }}
            onClick={onClick}
            onMouseDown={onMouseDown}
        >
            {children}
        </div>
    );
};

// Resize Handle
export const ResizeHandle = ({
    position,
    onMouseDown,
    className
}: {
    position: 'start' | 'end';
    onMouseDown: (e: React.MouseEvent) => void;
    className?: string; // เพิ่ม prop สำหรับรับ className จากภายนอก
}) => (
    <div
        className={`resize-handle w-3 h-full absolute top-0 cursor-col-resize bg-white/30 transition-all duration-200 z-30
              hover:opacity-100 hover:bg-white/60 hover:w-4
              ${position === 'start' ? 'left-0 rounded-l' : 'right-0 rounded-r'}
              ${className || ''}`} // เพิ่มความกว้าง, ใส่สีพื้นหลังที่สามารถมองเห็นได้
        onMouseDown={onMouseDown}
    />
);

// Task Tooltip
export const TaskTooltip = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`task-tooltip absolute bg-[#172B4D] text-white p-2 rounded text-xs z-50 shadow-md min-w-[200px] pointer-events-none hidden transition-opacity duration-300 ease-in-out ${className || ''}`}>
        {children}
    </div>
);

// Task Progress
export const TaskProgress = ({ progress }: { progress: number }) => (
    <div className="absolute bottom-0 left-0 h-0.5 bg-white/30 transition-all duration-300 w-full">
        <div
            className="h-full bg-white rounded-sm"
            style={{ width: `${progress}%` }}
        />
    </div>
);

// Status and Priority Indicators
export const StatusIndicator = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-500';
            case 'in progress': return 'bg-blue-500';
            case 'delayed': return 'bg-red-500';
            case 'pending': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className={`task-status absolute top-0.5 right-1 w-2 h-2 rounded-full ${getStatusColor(status)}`} />
    );
};

export const PriorityIndicator = ({ priority }: { priority: string }) => {
    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className={`task-priority absolute top-0.5 left-1 w-2 h-2 rounded-full ${getPriorityColor(priority)}`} />
    );
};

// Month Header
export const MonthHeader = ({ month, width }: { month: string; width: string | number }) => (
    <div
        className="border-r border-[#DFE1E6]"
        style={{ width }}
    >
        <div className="month-header bg-[#F4F5F7] border-b border-[#DFE1E6] text-xs font-semibold text-[#172B4D] h-5 px-1 flex items-center">
            {month}
        </div>
    </div>
);

// Day Cell
export const DayCell: React.FC<{
    day: number;
    isWeekend: boolean;
    isToday: boolean;
}> = ({ day, isWeekend, isToday }) => (
    <div
        className={`
      flex justify-center items-center h-full w-[40px] border-r border-gray-200 text-xs relative
      ${isWeekend ? 'bg-gray-50' : ''}
      ${isToday ? 'day-cell-today font-bold' : ''}
    `}
    >
        {isToday ? (
            <>
                {/* พื้นหลังและเส้นไฮไลท์วันปัจจุบัน - เปลี่ยนเป็นสีแดง */}
                <div className="absolute top-0 bottom-0 left-0 w-full bg-red-100 z-0"></div>

                {/* วันที่ที่มีสไตล์พิเศษ - เปลี่ยนเป็นสีแดง */}
                <div className="absolute top-[1px] left-1/2 transform -translate-x-1/2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center z-20 shadow-sm">
                    {day}
                </div>
            </>
        ) : (
            day
        )}
    </div>
);