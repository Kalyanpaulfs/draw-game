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
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
                Game Over!
            </h1>

            {/* Podium */}
            <div className="flex items-end justify-center gap-4 mb-12 w-full max-w-2xl">
                {/* 2nd Place */}
                {second && (
                    <div className="flex flex-col items-center">
                        <div className="text-4xl mb-2">{second.avatar}</div>
                        <div className="w-24 h-32 bg-gray-400 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-gray-300 shadow-lg">
                            <span className="text-2xl font-bold text-gray-800">2</span>
                            <span className="text-xs font-bold text-gray-800 mt-1">{second.name}</span>
                            <span className="text-sm font-bold text-gray-900">{second.score} pts</span>
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {first && (
                    <div className="flex flex-col items-center z-10">
                        <div className="text-6xl mb-4 animate-bounce">{first.avatar}</div>
                        <div className="w-32 h-48 bg-yellow-400 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-yellow-200 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 w-full h-full bg-yellow-300 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <span className="text-5xl font-black text-yellow-800">1</span>
                            <span className="text-sm font-bold text-yellow-900 mt-2">{first.name}</span>
                            <span className="text-lg font-bold text-yellow-900">{first.score} pts</span>
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {third && (
                    <div className="flex flex-col items-center">
                        <div className="text-4xl mb-2">{third.avatar}</div>
                        <div className="w-24 h-24 bg-orange-700 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-orange-500 shadow-lg">
                            <span className="text-2xl font-bold text-orange-200">3</span>
                            <span className="text-xs font-bold text-orange-200 mt-1">{third.name}</span>
                            <span className="text-sm font-bold text-orange-100">{third.score} pts</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Other Players */}
            {others.length > 0 && (
                <div className="w-full max-w-md bg-gray-800 rounded-xl p-4 mb-8">
                    <h3 className="text-gray-400 text-center mb-4 uppercase tracking-widest text-xs">Honorary Mentions</h3>
                    <div className="space-y-2">
                        {others.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-mono w-6">#{i + 4}</span>
                                    <span>{p.avatar} {p.name}</span>
                                </div>
                                <span className="font-bold text-gray-300">{p.score} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-4 items-center">
                {room.hostId === userId ? (
                    <button
                        onClick={handleReset}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <span>🔄</span> Start New Game
                    </button>
                ) : (
                    <div className="text-gray-400 animate-pulse bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                        Waiting for host <span className="text-white font-bold">{room.players[room.hostId]?.name || "Unknown"}</span> to restart...
                    </div>
                )}

                <Link
                    href="/"
                    className="text-gray-500 hover:text-white hover:underline transition-colors text-sm"
                >
                    Leave Room
                </Link>
            </div>
        </div>
    );
}
