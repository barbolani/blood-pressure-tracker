import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export type Reading = {
    sys: number; // High pressure
    dia: number; // Low pressure
    bpm?: number; // Beats per minute (optional)
    time?: string; // Time of the reading
};

export type MealRound = {
    time?: string; // Legacy time of the round
    readings: Reading[]; // Array of 3 readings
    average: Reading; // Calculated average of the 3 readings
};

export type DailyRecord = {
    date: string; // YYYY-MM-DD
    breakfast?: MealRound;
    lunch?: MealRound;
    dinner?: MealRound;
    dailyAverage?: Reading; // Calculated average of all meals that day
};

type AppState = {
    records: Record<string, DailyRecord>; // Keyed by date (YYYY-MM-DD)
    addRound: (date: string, meal: 'breakfast' | 'lunch' | 'dinner', round: MealRound) => void;
    deleteRound: (date: string, meal: 'breakfast' | 'lunch' | 'dinner') => void;
    deleteDay: (date: string) => void;
};

// Custom IndexedDB storage for Zustand using localforage
const storage = {
    getItem: async (name: string): Promise<string | null> => {
        return await localforage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await localforage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await localforage.removeItem(name);
    },
};

const calculateDailyAverage = (record: DailyRecord): Reading | undefined => {
    const allReadings: Reading[] = [];
    if (record.breakfast) allReadings.push(record.breakfast.average);
    if (record.lunch) allReadings.push(record.lunch.average);
    if (record.dinner) allReadings.push(record.dinner.average);

    if (allReadings.length === 0) return undefined;

    const sum = allReadings.reduce(
        (acc, curr) => ({
            sys: acc.sys + curr.sys,
            dia: acc.dia + curr.dia,
            bpm: (acc.bpm || 0) + (curr.bpm || 0),
        }),
        { sys: 0, dia: 0, bpm: 0 } as Reading
    );

    const countWithBpm = allReadings.filter((r) => r.bpm !== undefined).length;

    return {
        sys: Math.round(sum.sys / allReadings.length),
        dia: Math.round(sum.dia / allReadings.length),
        bpm: countWithBpm > 0 ? Math.round((sum.bpm || 0) / countWithBpm) : undefined,
    };
};

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            records: {},
            addRound: (date, meal, round) =>
                set((state) => {
                    const currentRecord = state.records[date] || { date };
                    const updatedRecord = { ...currentRecord, [meal]: round };
                    updatedRecord.dailyAverage = calculateDailyAverage(updatedRecord);

                    return {
                        records: {
                            ...state.records,
                            [date]: updatedRecord,
                        },
                    };
                }),
            deleteRound: (date, meal) =>
                set((state) => {
                    const currentRecord = state.records[date];
                    if (!currentRecord) return state;

                    const updatedRecord = { ...currentRecord };
                    delete updatedRecord[meal];
                    updatedRecord.dailyAverage = calculateDailyAverage(updatedRecord);

                    // If no meals left, we might want to keep the empty day or delete it. 
                    // Let's keep it clean and delete it if empty.
                    if (!updatedRecord.breakfast && !updatedRecord.lunch && !updatedRecord.dinner) {
                        const newRecords = { ...state.records };
                        delete newRecords[date];
                        return { records: newRecords };
                    }

                    return {
                        records: {
                            ...state.records,
                            [date]: updatedRecord,
                        },
                    };
                }),
            deleteDay: (date) =>
                set((state) => {
                    const newRecords = { ...state.records };
                    delete newRecords[date];
                    return { records: newRecords };
                }),
        }),
        {
            name: 'bp-tracker-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
