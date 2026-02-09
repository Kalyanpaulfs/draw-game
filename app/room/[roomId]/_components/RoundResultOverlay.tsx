"use client";

import { Room } from "@/lib/types";
import { useEffect, useState } from "react";
import { cn } from "@/lib/game-utils";

export function RoundResultOverlay({ room }: { room: Room }) {
    const [isVisible, setIsVisible] = useState(false);
    const secretWord = room.turn?.secretWord || "";
    const correctGuessers = room.turn?.correctGuessers || [];

    useEffect(() => {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    if (!room.turn || room.turn.phase !== "revealing") return null;

    return (
        <div className={cn(
            "absolute inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500",
            isVisible ? "bg-slate-950/80 backdrop-blur-md opacity-100" : "opacity-0 pointer-events-none"
        )}>
            <div className="w-full max-w-lg transform transition-all duration-500 scale-100 translate-y-0">

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-sm font-bold tracking-[0.2em] text-indigo-400 uppercase mb-2 animate-fade-in-up">
                        Round Over
                    </h2>
                    <div className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 animate-scale-in drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        {secretWord}
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto rounded-full" />
                </div>

                {/* Winners List */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
                        Correct Guessers
                        <span className="ml-2 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                            {correctGuessers.length}
                        </span>
                    </h3>

                    {correctGuessers.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {correctGuessers.map((playerId, index) => {
                                const player = room.players[playerId];
                                if (!player) return null;
                                return (
                                    <div
                                        key={playerId}
                                        className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 animate-slide-in-right"
                                        style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}
                                    >
                                        <span className="text-2xl">{player.avatar}</span>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-white truncate">
                                                {player.name}
                                            </div>
                                            <div className="text-[10px] text-emerald-400 font-medium">
                                                +{Math.round(50 + (0.5 * 50))} pts
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 italic">
                            No one guessed the word... 😢
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mt-8 relative h-1.5 bg-slate-800 rounded-full overflow-hidden w-full max-w-xs mx-auto">
                    <div className="absolute inset-y-0 left-0 bg-indigo-500 animate-progress-shrink w-full rounded-full" />
                </div>
            </div>

            <style jsx>{`
                @keyframes scale-in {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes slide-in-right {
                    0% { transform: translateX(-10px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes progress-shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
                .animate-progress-shrink { animation: progress-shrink 3s linear forwards; }
            `}</style>
        </div>
    );
}
