"use client";

import { usePublicRooms } from "@/hooks/usePublicRooms";
import { Users, Clock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/game-utils";

export function PublicLobbies() {
    const { publicRooms, loading, error } = usePublicRooms();

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto mt-24 px-6">
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                    <p className="font-medium">Scanning for open lobbies...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl mx-auto mt-24 px-6 text-center">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-rose-400">
                    <p className="font-bold">Failed to load public rooms.</p>
                    <p className="text-sm mt-1">{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto mt-24 px-6 relative z-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                        Public Lobbies
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </h2>
                    <p className="text-slate-400 mt-1">Join an open game instantly</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-xs font-medium text-slate-400">
                    <Users className="w-4 h-4" />
                    {publicRooms.length} {publicRooms.length === 1 ? 'Room' : 'Rooms'} Online
                </div>
            </div>

            {publicRooms.length === 0 ? (
                <div className="bg-slate-900/40 border border-white/5 border-dashed rounded-3xl p-12 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 group-hover:to-indigo-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-500 border border-white/5">
                            <Users className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">It's quiet in here...</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-6">
                            There are currently no public rooms available. Be the first to start a game and wait for others to join!
                        </p>
                        <Link
                            href="/play?tab=create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                        >
                            Create a Room
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publicRooms.map((room) => {
                        const playerCount = Object.keys(room.players).length;
                        const isFull = playerCount >= room.config.maxPlayers;
                        const hostName = room.players[room.hostId]?.name || "Unknown Host";

                        return (
                            <Link
                                key={room.roomId}
                                href={`/play?tab=join&roomId=${room.roomId}`}
                                className={cn(
                                    "group relative bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden",
                                    isFull && "opacity-60 pointer-events-none"
                                )}
                            >
                                {/* Hover Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                <div className="relative z-10 flex items-start justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                                            <span className="uppercase tracking-wider text-xs bg-black/40 px-2 py-0.5 rounded text-slate-300">
                                                ID: {room.roomId}
                                            </span>
                                            {isFull && <span className="text-rose-400 text-xs font-bold uppercase">Full</span>}
                                        </div>

                                        <h3 className="text-xl font-bold text-white">
                                            {hostName}'s Game
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4 text-indigo-400" />
                                                <span className={isFull ? "text-rose-400 font-bold" : "text-slate-300"}>
                                                    {playerCount} / {room.config.maxPlayers}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-purple-400" />
                                                <span className="text-slate-300">{room.config.rounds} Rounds</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
