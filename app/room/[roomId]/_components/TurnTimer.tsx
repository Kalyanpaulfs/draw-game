"use client";

import { cn } from "@/lib/game-utils";

export function TurnTimer({ timeLeft }: { timeLeft: number }) {
    return (
        <div className="flex flex-col items-center">
            <div className={cn(
                "text-3xl font-bold font-mono p-4 rounded-full w-20 h-20 flex items-center justify-center border-4 shadow-lg transition-colors",
                timeLeft <= 5 ? "border-red-500 text-red-500 bg-red-900/20 animate-pulse" : "border-gray-600 text-white bg-gray-800"
            )}>
                {timeLeft}
            </div>
            <span className="text-xs text-center text-gray-500 mt-1 uppercase tracking-wider">Seconds</span>
        </div>
    );
}
