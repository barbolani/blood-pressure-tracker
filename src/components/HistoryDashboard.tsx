import { useStore, type MealRound } from '../store';
import { format, parseISO } from 'date-fns';
import { Download, Trash2 } from 'lucide-react';

export default function HistoryDashboard() {
    const { records, deleteRound, deleteDay } = useStore();

    // Sort dates descending
    const sortedDates = Object.keys(records).sort((a, b) => b.localeCompare(a));

    const exportCsv = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Meal,Time 1,Sys 1,Dia 1,BPM 1,Time 2,Sys 2,Dia 2,BPM 2,Time 3,Sys 3,Dia 3,BPM 3,Avg Sys,Avg Dia,Avg BPM\n";

        sortedDates.forEach(date => {
            const record = records[date];

            const addMealRow = (mealName: string, round?: MealRound) => {
                if (!round) return;

                const r1 = round.readings[0] || { sys: '', dia: '', bpm: '', time: '' };
                const r2 = round.readings[1] || { sys: '', dia: '', bpm: '', time: '' };
                const r3 = round.readings[2] || { sys: '', dia: '', bpm: '', time: '' };

                csvContent += `${date},${mealName},` +
                    `${r1.time || ''},${r1.sys},${r1.dia},${r1.bpm || ''},` +
                    `${r2.time || ''},${r2.sys},${r2.dia},${r2.bpm || ''},` +
                    `${r3.time || ''},${r3.sys},${r3.dia},${r3.bpm || ''},` +
                    `${round.average.sys},${round.average.dia},${round.average.bpm || ''}\n`;
            };

            addMealRow('Breakfast', record.breakfast);
            addMealRow('Lunch', record.lunch);
            addMealRow('Dinner', record.dinner);

            if (record.dailyAverage) {
                csvContent += `${date},DAILY AVERAGE,,,,,,,,,,,,${record.dailyAverage.sys},${record.dailyAverage.dia},${record.dailyAverage.bpm || ''}\n`;
            }
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `blood-pressure-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (sortedDates.length === 0) {
        return (
            <div className="text-center py-12 flex flex-col items-center justify-center opacity-60">
                <ActivityIcon className="w-16 h-16 mb-4 text-slate-400" />
                <h2 className="text-xl font-medium text-slate-600 dark:text-slate-300">No records yet</h2>
                <p className="text-slate-500 mt-2">Start adding your blood pressure readings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">History</h2>
                <button
                    onClick={exportCsv}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 rounded-xl transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="space-y-4">
                {sortedDates.map((date) => {
                    const record = records[date];
                    return (
                        <div key={date} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-semibold text-lg">{format(parseISO(date), 'MMM d, yyyy')}</h3>
                                <div className="flex items-center gap-4">
                                    {record.dailyAverage && (
                                        <div className="text-sm font-medium bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
                                            Avg: <span className={getBloodPressureColorClass(record.dailyAverage.sys, record.dailyAverage.dia)}>{record.dailyAverage.sys}/{record.dailyAverage.dia}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete all entries for this day?')) {
                                                deleteDay(date);
                                            }
                                        }}
                                        className="text-rose-500 hover:text-rose-600 p-1"
                                        title="Delete entirety of this day"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {['breakfast', 'lunch', 'dinner'].map((mealStr) => {
                                    const meal = mealStr as 'breakfast' | 'lunch' | 'dinner';
                                    const round = record[meal];
                                    if (!round) return null;

                                    return (
                                        <div key={meal} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="font-semibold uppercase tracking-wider text-xs text-slate-700 dark:text-slate-300">{meal}</span>
                                                    {round.time && <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{round.time}</span>}
                                                </div>

                                                <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                                                    {round.readings.map((r, i) => (
                                                        <div key={i} className="flex flex-col border-l-2 border-rose-100 dark:border-rose-900/30 pl-3">
                                                            <span className="text-[10px] uppercase tracking-wider opacity-70 font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                                                {r.time || `#${i + 1}`}
                                                            </span>
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-base">
                                                                {r.sys}<span className="text-xs text-slate-400 font-normal mx-0.5">/</span>{r.dia}
                                                                {r.bpm ? <span className="opacity-80 text-xs text-rose-500 ml-1 font-medium">♥{r.bpm}</span> : ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Average</span>
                                                    <span className={`text-xl font-bold ${getBloodPressureColorClass(round.average.sys, round.average.dia)}`}>
                                                        {round.average.sys} / {round.average.dia}
                                                    </span>
                                                    {round.average.bpm && <span className="text-sm text-rose-500 flex items-center gap-1 font-medium"><ActivityIcon className="w-3 h-3" /> {round.average.bpm} bpm</span>}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Delete ${meal} entries?`)) {
                                                            deleteRound(date, meal);
                                                        }
                                                    }}
                                                    className="text-slate-400 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
        </svg>
    )
}

function getBloodPressureColorClass(sys: number, dia: number) {
    if (sys < 120 && dia < 80) return "text-emerald-600 dark:text-emerald-400"; // Normal
    if (sys < 130 && dia < 80) return "text-yellow-600 dark:text-yellow-400"; // Elevated
    if (sys < 140 || dia < 90) return "text-orange-600 dark:text-orange-400"; // Stage 1
    return "text-rose-600 dark:text-rose-500"; // Stage 2 or higher
}
