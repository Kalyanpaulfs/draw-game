"use client";

import { Room, Player } from "@/lib/types";
import { startGame, toggleReady, kickPlayer, updateRoomConfig } from "@/lib/room-actions";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/game-utils";
import { useRouter } from "next/navigation";
import { useSound } from "@/hooks/SoundContext";
import { SoundEvent } from "@/lib/sound-config";
import { KickModal } from "@/app/_components/KickModal";

interface LobbyViewProps {
    room: Room;
    userId: string;
    roomId: string;
}

export function LobbyView({ room, userId, roomId }: LobbyViewProps) {
    const [isStarting, setIsStarting] = useState(false);
    const [pendingKick, setPendingKick] = useState<{ id: string; name: string } | null>(null);
    const { playSound } = useSound();
    const router = useRouter();
    const isHost = room.hostId === userId;
    const playerCount = Object.keys(room.players).length;
    const player = room.players[userId]; // Current user's player object

    // Track player join/leave and ready states
    const prevPlayersRef = useRef<Record<string, boolean>>({});

    useEffect(() => {
        const currentPlayers = room.players;
        const currentPlayerIds = Object.keys(currentPlayers);
        const prevPlayerIds = Object.keys(prevPlayersRef.current);

        // Handle join/leave
        if (currentPlayerIds.length > prevPlayerIds.length) {
            playSound(SoundEvent.PLAYER_JOIN);
        } else if (currentPlayerIds.length < prevPlayerIds.length) {
            playSound(SoundEvent.PLAYER_LEAVE);
        }

        // Handle ready state changes for any player
        currentPlayerIds.forEach(id => {
            const isReady = currentPlayers[id].isReady;
            const wasReady = prevPlayersRef.current[id];

            if (wasReady !== undefined && isReady !== wasReady) {
                if (isReady) {
                    playSound(SoundEvent.PLAYER_READY);
                } else {
                    playSound(SoundEvent.PLAYER_UNREADY);
                }
            }
        });

        // Update ref with current states
        const newStates: Record<string, boolean> = {};
        currentPlayerIds.forEach(id => {
            newStates[id] = currentPlayers[id].isReady;
        });
        prevPlayersRef.current = newStates;
    }, [room.players, playSound]);

    // Track game start
    useEffect(() => {
        if (room.status === 'playing') {
            playSound(SoundEvent.GAME_START);
        }
    }, [room.status, playSound]);

    // Track config changes for sound
    const prevConfigRef = useRef(room.config);
    useEffect(() => {
        if (JSON.stringify(room.config) !== JSON.stringify(prevConfigRef.current)) {
            playSound(SoundEvent.SETTINGS_CHANGE);
            prevConfigRef.current = room.config;
        }
    }, [room.config, playSound]);



    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
    };

    const handleKick = (targetUserId: string, targetName: string) => {
        setPendingKick({ id: targetUserId, name: targetName });
        playSound(SoundEvent.CLICK_SOFT);
    };

    const confirmKick = async () => {
        if (!pendingKick) return;
        try {
            await kickPlayer(roomId, pendingKick.id, userId);
            setPendingKick(null);
        } catch (e) {
            console.error(e);
            alert("Failed to kick player");
        }
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">

            {/* --- Main Content (Scrollable) --- */}
            <main className="w-full h-full relative md:flex md:flex-row overflow-hidden">

                {/* Players Grid - Scrollable Amount */}
                <div className="absolute inset-0 md:static md:flex-1 md:h-full overflow-y-auto pr-2 custom-scrollbar z-0 touch-pan-y">
                    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pb-40 md:pb-0">
                            {Object.values(room.players).map((p: Player) => (
                                <div key={p.id} className="group relative">
                                    {/* Kick Button (Host Only) */}
                                    {isHost && p.id !== userId && (
                                        <button
                                            onClick={() => handleKick(p.id, p.name)}
                                            className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-30 border-2 border-slate-900 sm:opacity-0 sm:group-hover:opacity-100 sm:scale-95 sm:group-hover:scale-110"
                                            title="Kick Player"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}

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
                            {Array.from({ length: Math.max(0, room.config.maxPlayers - playerCount) }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-24 md:h-28 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center gap-3 text-slate-600">
                                    <span className="text-2xl opacity-20">Waiting...</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls - Fixed on Mobile, Static on Desktop */}
                <div className="fixed bottom-0 left-0 right-0 md:static md:w-80 md:flex-none p-4 md:p-6 lg:p-8 md:pl-0 bg-slate-900/90 md:bg-transparent border-t md:border-t-0 md:border-l border-white/10 backdrop-blur-xl md:backdrop-blur-none z-50 pb-6 md:pb-0 safe-area-bottom">
                    <div className="flex flex-col gap-4">

                        {/* Room Settings */}
                        <div className="p-4 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/5 space-y-4 shadow-inner">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] text-center">Room Settings</div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Rounds</span>
                                <div className="flex items-center gap-1">
                                    {isHost ? (
                                        <>
                                            <button
                                                onClick={() => updateRoomConfig(roomId, { rounds: room.config.rounds - 1 }, userId)}
                                                disabled={room.config.rounds <= 1}
                                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/5 disabled:opacity-20 transition-colors flex items-center justify-center text-lg font-bold"
                                            >-</button>
                                            <span className="w-8 text-center text-sm font-black text-white">{room.config.rounds}</span>
                                            <button
                                                onClick={() => updateRoomConfig(roomId, { rounds: room.config.rounds + 1 }, userId)}
                                                disabled={room.config.rounds >= 10}
                                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/5 disabled:opacity-20 transition-colors flex items-center justify-center text-lg font-bold"
                                            >+</button>
                                        </>
                                    ) : (
                                        <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-sm font-black text-white">{room.config.rounds}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Capacity</span>
                                <div className="flex items-center gap-1">
                                    {isHost ? (
                                        <>
                                            <button
                                                onClick={() => updateRoomConfig(roomId, { maxPlayers: room.config.maxPlayers - 1 }, userId)}
                                                disabled={room.config.maxPlayers <= 2}
                                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/5 disabled:opacity-20 transition-colors flex items-center justify-center text-lg font-bold"
                                            >-</button>
                                            <span className="w-8 text-center text-sm font-black text-white">{room.config.maxPlayers}</span>
                                            <button
                                                onClick={() => updateRoomConfig(roomId, { maxPlayers: room.config.maxPlayers + 1 }, userId)}
                                                disabled={room.config.maxPlayers >= 12}
                                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/5 disabled:opacity-20 transition-colors flex items-center justify-center text-lg font-bold"
                                            >+</button>
                                        </>
                                    ) : (
                                        <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-sm font-black text-white">{room.config.maxPlayers}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Ready Button */}
                        <button
                            onClick={() => {
                                toggleReady(roomId, userId);
                            }}
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
                                        playSound(SoundEvent.CLICK_SOFT);
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



            <style jsx global>{`
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>

            <KickModal
                isOpen={!!pendingKick}
                playerName={pendingKick?.name || ""}
                onClose={() => setPendingKick(null)}
                onConfirm={confirmKick}
            />
        </div>
    );
}
