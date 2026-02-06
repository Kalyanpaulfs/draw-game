"use client";

import { Room } from "@/lib/types";
import { startGame } from "@/lib/room-actions";
import { useState } from "react";
import { cn } from "@/lib/game-utils";

interface LobbyViewProps {
    room: Room;
    userId: string;
    roomId: string; // explicitly passed for display/copy
}

export function LobbyView({ room, userId, roomId }: LobbyViewProps) {
    const [isStarting, setIsStarting] = useState(false);
    const isHost = room.hostId === userId;
    const playerCount = Object.keys(room.players).length;

    return (
        <div className="w-full max-w-5xl">
            <div className="bg-slate-900/30 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl min-h-[500px] flex flex-col relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                <h2 className="text-xl font-medium mb-8 flex items-center gap-3 text-slate-300">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="tracking-wide uppercase text-xs font-bold opacity-70">Lobby Status:</span>
                    <span className="text-white font-semibold tracking-tight">Waiting for players...</span>
                </h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 content-start">
                    {Object.values(room.players).map((player) => (
                        <div
                            key={player.id}
                            className={cn(
                                "relative p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 group",
                                "bg-slate-800/40 border border-white/5 hover:bg-slate-800/60 hover:border-white/10",
                                player.id === room.hostId && "bg-indigo-900/10 border-indigo-500/20 shadow-[0_0_20px_-5px_rgba(99,102,241,0.1)]"
                            )}
                        >
                            <div className="text-5xl mb-2 drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">{player.avatar}</div>
                            <div className="font-bold text-white tracking-tight truncate max-w-full text-lg">{player.name}</div>

                            {player.id === room.hostId && (
                                <span className="absolute top-3 right-3 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider backdrop-blur-sm">
                                    Host
                                </span>
                            )}
                            {player.id === userId && (
                                <span className="absolute top-3 left-3 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider backdrop-blur-sm">
                                    You
                                </span>
                            )}
                        </div>
                    ))}

                    {Array.from({ length: Math.max(0, room.config.maxPlayers - playerCount) }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-900/20 p-6 rounded-2xl flex flex-col items-center justify-center border border-white/5 border-dashed opacity-40 hover:opacity-60 transition-opacity">
                            <div className="text-4xl mb-2 grayscale opacity-50">👤</div>
                            <div className="text-slate-500 text-xs font-medium uppercase tracking-widest">Open Slot</div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-center gap-4">
                    {isHost ? (
                        <>
                            <button
                                onClick={async () => {
                                    setIsStarting(true);
                                    await startGame(roomId);
                                    setIsStarting(false);
                                }}
                                className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] bg-right hover:bg-left transition-all duration-500 rounded-2xl font-bold text-lg text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6)] transform hover:-translate-y-1 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                disabled={playerCount < 2 || isStarting}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isStarting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Launching Game...
                                        </>
                                    ) : (
                                        <>🚀 Start Game</>
                                    )}
                                </span>
                            </button>
                            {playerCount < 2 && (
                                <p className="text-slate-500 text-sm animate-pulse">Waiting for at least one more player...</p>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="w-1/2 h-full bg-indigo-500 animate-loading-bar rounded-full"></div>
                            </div>
                            <span className="text-slate-400 text-sm font-medium animate-pulse">Waiting for host to launch...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
