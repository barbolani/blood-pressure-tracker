import { useState } from 'react';
import { useStore, type Reading, type MealRound } from '../store';
import { format } from 'date-fns';
import { PlusCircle, Clock, CalendarDays, Activity } from 'lucide-react';

type MealType = 'breakfast' | 'lunch' | 'dinner';

export default function DailyEntryForm() {
    const { addRound } = useStore();
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Predict meal based on current time
    const getInitialMeal = (): MealType => {
        const hour = new Date().getHours();
        if (hour < 11) return 'breakfast';
        if (hour < 16) return 'lunch';
        return 'dinner';
    };

    const [meal, setMeal] = useState<MealType>(getInitialMeal());
    const [readings, setReadings] = useState<Reading[]>([
        { sys: 120, dia: 80, bpm: 70 },
        { sys: 120, dia: 80, bpm: 70 },
        { sys: 120, dia: 80, bpm: 70 },
    ]);

    const handleReadingChange = (index: number, field: keyof Reading, value: string) => {
        const newReadings = [...readings];

        if (field === 'time') {
            newReadings[index] = { ...newReadings[index], [field]: value };
            setReadings(newReadings);
            return;
        }

        const parsedValue = parseInt(value);

        if (field === 'bpm' && value === '') {
            delete newReadings[index].bpm;
        } else if (value === '') {
            newReadings[index] = { ...newReadings[index], [field]: 0 };
        } else if (!isNaN(parsedValue)) {
            newReadings[index] = { ...newReadings[index], [field]: parsedValue };
        }

        setReadings(newReadings);
    };

    const handleRowFocus = (index: number) => {
        if (!readings[index].time) {
            const newReadings = [...readings];
            newReadings[index] = { ...newReadings[index], time: format(new Date(), 'HH:mm') };
            setReadings(newReadings);
        }
    };

    const calculateAverage = (currentReadings: Reading[]): Reading | null => {
        const validReadings = currentReadings.filter(r => r.sys > 0 && r.dia > 0);
        if (validReadings.length === 0) return null;

        const sum = validReadings.reduce(
            (acc, curr) => ({
                sys: acc.sys + curr.sys,
                dia: acc.dia + curr.dia,
                bpm: (acc.bpm || 0) + (curr.bpm || 0),
            }),
            { sys: 0, dia: 0, bpm: 0 } as Reading
        );

        const countWithBpm = validReadings.filter((r) => r.bpm !== undefined).length;

        return {
            sys: Math.round(sum.sys / validReadings.length),
            dia: Math.round(sum.dia / validReadings.length),
            bpm: countWithBpm > 0 ? Math.round((sum.bpm || 0) / countWithBpm) : undefined,
        };
    };

    const handleSave = () => {
        // Validate
        const isValid = readings.every(r => r.sys > 0 && r.dia > 0);
        if (!isValid) {
            alert("Please fill in systolic and diastolic values for all 3 readings.");
            return;
        }

        const average = calculateAverage(readings);
        if (!average) return;

        const round: MealRound = {
            readings,
            average,
        };

        addRound(date, meal, round);

        // Reset/inform user
        alert(`Successfully saved ${meal} readings for ${date}.`);
    };

    const average = calculateAverage(readings);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                <PlusCircle className="w-5 h-5 text-rose-500" />
                <h2 className="text-xl font-bold">New Reading</h2>
            </div>

            <div className="mb-8 sm:w-1/2 overflow-hidden">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow outline-none text-sm font-medium"
                    />
                </div>
            </div>

            <div className="mb-8">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Meal Period</label>
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                    {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMeal(m)}
                            className={`flex-1 capitalize py-2 rounded-lg text-sm font-medium transition-all ${meal === m
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900/5'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="grid grid-cols-4 gap-4 px-1 mb-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Time</div>
                    <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider text-center">Sys <span className="text-[10px] font-normal lowercase">(High)</span></div>
                    <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider text-center">Dia <span className="text-[10px] font-normal lowercase">(Low)</span></div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center gap-1"><Activity className="w-3 h-3" /> BPM</div>
                </div>

                {readings.map((reading, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-3 items-center" onFocus={() => handleRowFocus(idx)}>
                        <input
                            type="time"
                            value={reading.time || ''}
                            onChange={(e) => handleReadingChange(idx, 'time', e.target.value)}
                            className="w-full text-center py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none transition-shadow placeholder:text-slate-400 text-xs sm:text-sm px-0.5"
                        />
                        <input
                            type="number"
                            inputMode="numeric"
                            value={reading.sys || ''}
                            onChange={(e) => handleReadingChange(idx, 'sys', e.target.value)}
                            className="w-full text-center py-2.5 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-bold border border-rose-100 dark:border-rose-900/50 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-shadow placeholder:font-normal placeholder:text-rose-300"
                            placeholder="120"
                        />
                        <input
                            type="number"
                            inputMode="numeric"
                            value={reading.dia || ''}
                            onChange={(e) => handleReadingChange(idx, 'dia', e.target.value)}
                            className="w-full text-center py-2.5 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow placeholder:font-normal placeholder:text-blue-300"
                            placeholder="80"
                        />
                        <input
                            type="number"
                            inputMode="numeric"
                            value={reading.bpm || ''}
                            onChange={(e) => handleReadingChange(idx, 'bpm', e.target.value)}
                            className="w-full text-center py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none transition-shadow placeholder:text-slate-400"
                            placeholder="Opt"
                        />
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between mb-8 border border-slate-100 dark:border-slate-800">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Calculated Average</span>
                    <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                        {average ? `${average.sys} / ${average.dia}` : '- / -'}
                    </div>
                </div>
                {average?.bpm && (
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Heart Rate</span>
                        <div className="text-xl font-bold text-rose-500 flex items-center gap-1">
                            <Activity className="w-5 h-5" /> {average.bpm}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleSave}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
                Save {meal} Reading
            </button>

        </div>
    );
}
