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
        <div className="w-full max-w-4xl">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl min-h-[400px]">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Waiting for players...
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.values(room.players).map((player) => (
                        <div key={player.id} className="bg-gray-700/50 p-4 rounded-lg flex flex-col items-center border border-gray-600/50 relative group">
                            <div className="text-4xl mb-2">{player.avatar}</div>
                            <div className="font-bold truncate max-w-full">{player.name}</div>
                            {player.id === room.hostId && (
                                <span className="absolute top-2 right-2 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">
                                    HOST
                                </span>
                            )}
                            {player.id === userId && (
                                <span className="absolute top-2 left-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                                    YOU
                                </span>
                            )}
                        </div>
                    ))}

                    {Array.from({ length: Math.max(0, room.config.maxPlayers - playerCount) }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-800/30 p-4 rounded-lg flex flex-col items-center justify-center border border-gray-700/50 border-dashed opacity-50">
                            <div className="text-4xl mb-2 text-gray-600">👤</div>
                            <div className="text-gray-500 text-sm">Empty</div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-center">
                    {isHost ? (
                        <button
                            onClick={async () => {
                                setIsStarting(true);
                                await startGame(roomId);
                                setIsStarting(false);
                            }}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full font-bold text-lg shadow-lg shadow-green-500/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                            disabled={playerCount < 2 || isStarting}
                        >
                            {isStarting ? "Starting..." : "Start Game"} {playerCount < 2 && !isStarting && "(Need 2+)"}
                        </button>
                    ) : (
                        <div className="text-gray-400 animate-pulse">
                            Waiting for host to start...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
