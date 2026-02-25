import { Outlet } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-rose-500/30">
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-2xl">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
                        <Activity className="w-6 h-6 stroke-[2.5]" />
                        <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">BP Tracker</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl min-h-[calc(100vh-4rem)]">
                <Outlet />
            </main>
        </div>
    );
}
