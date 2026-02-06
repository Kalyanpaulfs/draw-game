"use client";

import { Room } from "@/lib/types";
import { selectWord } from "@/lib/room-actions";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";

export function WordSelector({ room }: { room: Room }) {
    const { userId } = useUser();
    const [loading, setLoading] = useState(false);

    // Only show if it's choosing phase and I am the drawer
    if (room.turn?.phase !== "choosing") return null;
    if (room.turn?.drawerId !== userId) return null;

    const handleSelect = async (word: string) => {
        setLoading(true);
        try {
            await selectWord(room.roomId, word);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-lg w-full text-center">
                <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    Choose a Word!
                </h2>
                <p className="text-gray-400 mb-8">What do you want to draw?</p>

                <div className="grid grid-cols-1 gap-4">
                    {room.turn.candidateWords.map((word) => (
                        <button
                            key={word}
                            onClick={() => handleSelect(word)}
                            disabled={loading}
                            className="py-4 text-xl font-bold bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg hover:border-yellow-500 hover:text-yellow-400 transition-all transform hover:scale-105"
                        >
                            {word}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
