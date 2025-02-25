import { differenceInDays, parseISO } from "date-fns";

export default function ProgressBar({ startDate, endDate }: { startDate: string; endDate: string }) {
    const today = new Date();
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const totalDuration = differenceInDays(end, start);
    const elapsedDuration = differenceInDays(today, start);
    const progress = Math.min((elapsedDuration / totalDuration) * 100, 100);

    return (
        <div className="relative bg-gray-200 h-4 rounded-lg overflow-hidden">
            <div
                className="bg-blue-500 h-4 rounded-lg"
                style={{ width: `${progress}%` }}
                title={`${progress.toFixed(1)}%`}
            ></div>
        </div>
    );
}