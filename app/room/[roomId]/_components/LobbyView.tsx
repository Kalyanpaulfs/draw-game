"use client";

import { Room } from "@/lib/types";
import { startGame, toggleReady, leaveRoom } from "@/lib/room-actions";
import { useState } from "react";
import { cn } from "@/lib/game-utils";
import { useRouter } from "next/navigation";

interface LobbyViewProps {
    room: Room;
    userId: string;
    roomId: string; // explicitly passed for display/copy
}

export function LobbyView({ room, userId, roomId }: LobbyViewProps) {
    const [isStarting, setIsStarting] = useState(false);
    const router = useRouter();
    const isHost = room.hostId === userId;
    const playerCount = Object.keys(room.players).length;

    const handleLeave = async () => {
        if (confirm("Are you sure you want to leave the room?")) {
            await leaveRoom(roomId, userId);
            router.push("/");
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4 lg:p-8">
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">

                {/* Header Bar */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 leading-none">Room Code</div>
                            <div className="text-3xl font-mono font-bold text-white tracking-widest leading-none select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(roomId)}>
                                {roomId}
                            </div>
                        </div>
                        <div className="hidden md:block h-10 w-px bg-white/10"></div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-sm font-bold text-slate-200">Draw Game</span>
                            <span className="text-xs text-slate-500">Waiting for players...</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="px-4 py-2 bg-slate-950/50 rounded-lg border border-white/5 flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className={cn("w-2 h-2 rounded-full ring-2 ring-slate-900", i < playerCount ? "bg-emerald-400" : "bg-slate-700")} />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-slate-400 ml-2">{playerCount}/4</span>
                        </div>
                        <button
                            onClick={handleLeave}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Player Grid */}
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                        {Object.values(room.players).map((player) => (
                            <div key={player.id} className="group relative">
                                <div className={cn(
                                    "absolute inset-0 rounded-3xl transition-all duration-300 opacity-0 group-hover:opacity-100",
                                    player.isReady ? "bg-emerald-500/20 blur-xl" : "bg-indigo-500/20 blur-xl"
                                )}></div>
                                <div className={cn(
                                    "relative h-full bg-slate-900/40 backdrop-blur-md border rounded-3xl p-6 flex flex-col items-center gap-4 transition-all duration-300",
                                    player.isReady ? "border-emerald-500/30 bg-emerald-950/10" : "border-white/5 hover:border-white/10"
                                )}>
                                    {/* Avatar */}
                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <div className={cn(
                                            "absolute inset-0 rounded-full opacity-20 animate-pulse",
                                            player.isReady ? "bg-emerald-500" : "bg-indigo-500"
                                        )}></div>
                                        <span className="text-6xl relative z-10 drop-shadow-lg">{player.avatar}</span>
                                        {player.id === room.hostId && (
                                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">Host</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="text-center w-full">
                                        <div className="font-bold text-white text-lg truncate mb-1">{player.name}</div>
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                            player.isReady ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-slate-800 text-slate-500"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", player.isReady ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
                                            {player.isReady ? "Ready" : "Not Ready"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, 4 - playerCount) }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-slate-900/20 border-2 border-dashed border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 opacity-40 hover:opacity-60 transition-opacity min-h-[240px]">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Open Slot</span>
                            </div>
                        ))}
                    </div>

                    {/* Sidebar / Controls */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex-1 flex flex-col justify-center gap-6 shadow-xl relative overflow-hidden">
                            {/* Glow Effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                            <div className="text-center">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Your Status</h3>
                                <button
                                    onClick={() => toggleReady(roomId, userId)}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-lg group relative overflow-hidden",
                                        room.players[userId]?.isReady
                                            ? "bg-slate-800 text-slate-400 border border-white/5 hover:text-white"
                                            : "bg-white text-slate-900 hover:bg-emerald-400 hover:text-emerald-950 border border-transparent shadow-emerald-500/20"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                        room.players[userId]?.isReady ? "bg-white/5" : "bg-white/20"
                                    )} />
                                    {room.players[userId]?.isReady ? (
                                        <><span>Cancel</span></>
                                    ) : (
                                        <>
                                            <div className="w-2 h-2 bg-emerald-500 group-hover:bg-emerald-900 rounded-full animate-ping" />
                                            <span>Ready Up</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {isHost ? (
                                <div className="pt-6 border-t border-white/5 text-center">
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Host Controls</h3>
                                    <button
                                        onClick={async () => {
                                            setIsStarting(true);
                                            try { await startGame(roomId); } catch (e) { alert("Wait for everyone to be ready!"); }
                                            setIsStarting(false);
                                        }}
                                        disabled={playerCount < 2 || isStarting || !Object.values(room.players).every(p => p.isReady)}
                                        className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:-translate-y-0.5 transition-all"
                                    >
                                        {isStarting ? "Starting..." : "Start Game"}
                                    </button>
                                    {(!Object.values(room.players).every(p => p.isReady) && playerCount >= 2) && (
                                        <p className="text-[10px] text-orange-400 mt-3 font-bold animate-pulse">Waiting for players...</p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center pt-4 border-t border-white/5">
                                    <div className="inline-block px-4 py-2 bg-slate-950/50 rounded-lg text-xs font-medium text-slate-500">
                                        Waiting for host to start...
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
