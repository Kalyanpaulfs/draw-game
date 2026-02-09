"use client";

import { Room } from "@/lib/types";
import { startGame, toggleReady, leaveRoom } from "@/lib/room-actions";
import { useState } from "react";
import { cn } from "@/lib/game-utils";
import { useRouter } from "next/navigation";

interface LobbyViewProps {
    room: Room;
    userId: string;
    roomId: string;
}

export function LobbyView({ room, userId, roomId }: LobbyViewProps) {
    const [isStarting, setIsStarting] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const router = useRouter();
    const isHost = room.hostId === userId;
    const playerCount = Object.keys(room.players).length;
    const player = room.players[userId]; // Current user's player object

    const handleLeave = async () => {
        await leaveRoom(roomId, userId);
        router.push("/");
    };

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">

            {/* --- Main Content (Scrollable) --- */}
            <main className="flex-1 overflow-hidden relative w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-6">

                {/* Players Grid - Scrollable Amount */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pb-32 md:pb-0">
                        {Object.values(room.players).map((p) => (
                            <div key={p.id} className="group relative">
                                {/* Glow Effect */}
                                <div className={cn(
                                    "absolute inset-0 rounded-2xl blur-xl transition-all duration-500",
                                    p.isReady ? "bg-emerald-500/20 opacity-100" : "bg-indigo-500/10 opacity-0 group-hover:opacity-100"
                                )}></div>

                                <div className={cn(
                                    "relative h-full bg-slate-900/80 backdrop-blur-md border rounded-2xl p-5 flex items-center gap-5 transition-all duration-300",
                                    p.isReady ? "border-emerald-500/30" : "border-white/5 hover:border-white/10"
                                )}>
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-2xl border border-white/10",
                                            p.isReady ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20" : "bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
                                        )}>
                                            {p.avatar}
                                        </div>
                                        {/* Status Indicator Badge */}
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 text-[10px]",
                                            p.isReady ? "bg-emerald-500 text-emerald-950" : "bg-slate-700 text-slate-400"
                                        )}>
                                            {p.isReady ? "✓" : "•"}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white text-lg truncate block">{p.name}</span>
                                            {p.id === room.hostId && (
                                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-black uppercase tracking-wider">HOST</span>
                                            )}
                                            {p.id === userId && (
                                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] font-black uppercase tracking-wider">YOU</span>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "text-xs font-medium flex items-center gap-1.5",
                                            p.isReady ? "text-emerald-400" : "text-slate-500"
                                        )}>
                                            {p.isReady ? (
                                                <>
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    Ready to play!
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                                    Not ready
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, 8 - playerCount) }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24 md:h-28 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center gap-3 text-slate-600">
                                <span className="text-2xl opacity-20">Waiting...</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Controls - Fixed on Desktop, Bottom Sheet on Mobile */}
                <div className="fixed bottom-0 left-0 right-0 md:static md:w-80 md:flex-none p-4 md:p-0 bg-slate-900/90 md:bg-transparent border-t md:border-t-0 border-white/10 backdrop-blur-xl md:backdrop-blur-none z-40 pb-6 md:pb-0 safe-area-bottom">
                    <div className="flex flex-col gap-4">

                        {/* Ready Button */}
                        <button
                            onClick={() => toggleReady(roomId, userId)}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-base uppercase tracking-widest transition-all duration-300 transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-3",
                                player?.isReady
                                    ? "bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700 hover:text-white"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25"
                            )}
                        >
                            {player?.isReady ? (
                                <>
                                    <span>Cancel Ready</span>
                                </>
                            ) : (
                                <>
                                    <span>Ready Up</span>
                                    <span className="text-xl">🚀</span>
                                </>
                            )}
                        </button>

                        {/* Host Controls */}
                        {isHost ? (
                            <div className="pt-0 md:pt-6 md:border-t border-white/5 text-center">
                                <div className="hidden md:block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Host Controls</div>
                                <button
                                    onClick={async () => {
                                        setIsStarting(true);
                                        try { await startGame(roomId); } catch (e) { alert("Wait for everyone to be ready!"); }
                                        setIsStarting(false);
                                    }}
                                    disabled={playerCount < 2 || isStarting || !Object.values(room.players).every(p => p.isReady)}
                                    className="w-full py-3 md:py-4 rounded-xl font-black text-sm uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                                >
                                    {isStarting ? (
                                        <span className="animate-pulse">Starting Game...</span>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <span>Start Game</span>
                                            {!(!Object.values(room.players).every(p => p.isReady) && playerCount >= 2) && <span>👑</span>}
                                        </div>
                                    )}
                                </button>
                                {(!Object.values(room.players).every(p => p.isReady) && playerCount >= 2) && (
                                    <p className="text-[10px] text-center text-amber-400/80 mt-2 font-medium">Wait for all players to be ready</p>
                                )}
                                {playerCount < 2 && (
                                    <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">Need at least 2 players</p>
                                )}
                            </div>
                        ) : (
                            // Status Message for Non-Hosts
                            <div className="hidden md:block pt-6 border-t border-white/5 text-center">
                                <p className="text-xs text-slate-500 font-medium animate-pulse">Waiting for host to start...</p>
                            </div>
                        )}

                    </div>
                </div>

            </main>

            {/* Leave Confirmation Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowLeaveModal(false)}
                    ></div>

                    {/* Modal */}
                    <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <span className="text-3xl">👋</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Leave Room?</h3>
                            <p className="text-sm text-slate-400 mb-6">Are you sure you want to leave? You can rejoin later with the room code.</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLeaveModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all active:scale-95"
                                >
                                    Stay
                                </button>
                                <button
                                    onClick={handleLeave}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                >
                                    Leave
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}
