"use client";

import { Room } from "@/lib/types";
import { resetGame } from "@/lib/room-actions";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/game-utils";
import Link from "next/link";

export default function GameOverView({ room }: { room: Room }) {
    const { userId } = useUser();
    const sortedPlayers = Object.values(room.players).sort((a, b) => b.score - a.score);
    const [first, second, third, ...others] = sortedPlayers;

    const handleReset = async () => {
        await resetGame(room.roomId);
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[600px] p-6 relative">
            <h1 className="text-6xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 mb-16 drop-shadow-[0_0_50px_rgba(168,85,247,0.4)] tracking-tighter text-center">
                GAME OVER
            </h1>

            {/* Podium */}
            <div className="flex items-end justify-center w-full max-w-3xl mb-16 perspective-1000">
                {/* 2nd Place */}
                {second && (
                    <div className="flex flex-col items-center transform translate-x-4 z-10 hover:-translate-y-2 transition-transform duration-500">
                        <div className="text-5xl mb-4 drop-shadow-2xl grayscale-[0.3]">{second.avatar}</div>
                        <div className="w-28 md:w-36 h-40 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t border-white/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-4xl font-black text-slate-800 opacity-80">2</span>
                            <span className="text-xs font-bold text-slate-900 mt-1 uppercase tracking-wider">{second.name}</span>
                            <span className="text-sm font-bold text-slate-900 bg-white/20 px-2 rounded mt-2 backdrop-blur-sm">{second.score}</span>
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {first && (
                    <div className="flex flex-col items-center z-20 transform -translate-y-4 hover:-translate-y-8 transition-transform duration-500">
                        <div className="relative">
                            <div className="text-7xl mb-4 drop-shadow-2xl animate-bounce">{first.avatar}</div>
                            <div className="absolute -top-6 -right-6 text-4xl animate-pulse">👑</div>
                        </div>
                        <div className="w-32 md:w-44 h-56 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 rounded-t-2xl flex flex-col items-center justify-start pt-6 border-t border-white/40 shadow-[0_0_100px_-20px_rgba(234,179,8,0.5)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            <span className="text-6xl font-black text-yellow-900 drop-shadow-sm">1</span>
                            <span className="text-sm font-black text-yellow-950 mt-2 uppercase tracking-widest">{first.name}</span>
                            <span className="text-xl font-bold text-yellow-950 bg-yellow-950/10 px-3 py-1 rounded-lg mt-2 backdrop-blur-sm">{first.score} pts</span>
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {third && (
                    <div className="flex flex-col items-center transform -translate-x-4 z-10 hover:-translate-y-2 transition-transform duration-500">
                        <div className="text-5xl mb-4 drop-shadow-2xl grayscale-[0.5] sepia-[0.5]">{third.avatar}</div>
                        <div className="w-28 md:w-36 h-32 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-700 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t border-white/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-4xl font-black text-orange-900 opacity-80">3</span>
                            <span className="text-xs font-bold text-orange-900 mt-1 uppercase tracking-wider">{third.name}</span>
                            <span className="text-sm font-bold text-orange-900 bg-white/20 px-2 rounded mt-2 backdrop-blur-sm">{third.score} pts</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Other Players */}
            {others.length > 0 && (
                <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 mb-12 border border-white/5 shadow-2xl">
                    <h3 className="text-slate-400 text-center mb-6 uppercase tracking-[0.2em] text-xs font-bold">Honorary Mentions</h3>
                    <div className="space-y-3">
                        {others.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-500 font-mono text-xs w-6">#{i + 4}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{p.avatar}</span>
                                        <span className="font-bold text-slate-300">{p.name}</span>
                                    </div>
                                </div>
                                <span className="font-bold text-slate-200 font-mono bg-slate-950/30 px-2 py-1 rounded text-sm">{p.score} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-6 items-center w-full max-w-md mt-10">
                {room.hostId === userId ? (
                    <button
                        onClick={handleReset}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:scale-105 transition-all flex items-center justify-center gap-3 border border-white/10 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <span className="relative z-10 text-2xl">🔄</span>
                        <span className="relative z-10 text-white tracking-wide">Start New Game</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-full border border-white/10 backdrop-blur-md">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                        <span className="text-slate-400 text-sm font-medium">Waiting for host to restart...</span>
                    </div>
                )}

                <Link
                    href="/"
                    className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Main Menu
                </Link>
            </div>
        </div>
    );
}
