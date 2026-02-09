"use client";

import { Room, Difficulty } from "@/lib/types";
import { selectWord, selectDifficulty } from "@/lib/room-actions";
import { useUser } from "@/hooks/useUser";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useState } from "react";
import { cn } from "@/lib/game-utils";

export function WordSelector({ room }: { room: Room }) {
    const { userId } = useUser();
    const { timeLeft } = useGameLoop(room, userId);
    const [loading, setLoading] = useState(false);

    // Check phase
    const phase = room.turn?.phase;
    if (phase !== "choosing_difficulty" && phase !== "choosing_word") return null;
    if (room.turn?.drawerId !== userId) return null;

    const handleSelectWord = async (word: string) => {
        setLoading(true);
        try {
            await selectWord(room.roomId, word);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDifficulty = async (diff: Difficulty) => {
        setLoading(true);
        try {
            await selectDifficulty(room.roomId, diff);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const Timer = () => (
        <div className="absolute top-4 right-4 flex items-center justify-center">
            <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-all shadow-lg backdrop-blur-md",
                timeLeft <= 5 ? "border-red-500 text-red-400 bg-red-900/20 animate-pulse" : "border-indigo-500 text-indigo-300 bg-indigo-900/20"
            )}>
                {timeLeft}
            </div>
        </div>
    );

    if (phase === "choosing_difficulty") {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-lg w-full text-center animate-in fade-in zoom-in duration-300 relative">
                    <Timer />
                    <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        Select Difficulty
                    </h2>
                    <p className="text-gray-400 mb-8">Choose your challenge level!</p>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => handleSelectDifficulty("easy")}
                            disabled={loading}
                            className="py-4 text-xl font-bold bg-green-900/50 hover:bg-green-800 border border-green-700 text-green-200 rounded-lg hover:border-green-400 transition-all hover:scale-105"
                        >
                            Easy (3-4 letters)
                        </button>
                        <button
                            onClick={() => handleSelectDifficulty("medium")}
                            disabled={loading}
                            className="py-4 text-xl font-bold bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-700 text-yellow-200 rounded-lg hover:border-yellow-400 transition-all hover:scale-105"
                        >
                            Medium (5-7 letters)
                        </button>
                        <button
                            onClick={() => handleSelectDifficulty("hard")}
                            disabled={loading}
                            className="py-4 text-xl font-bold bg-red-900/50 hover:bg-red-800 border border-red-700 text-red-200 rounded-lg hover:border-red-400 transition-all hover:scale-105"
                        >
                            Hard (8+ letters)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-lg w-full text-center animate-in fade-in zoom-in duration-300 relative">
                <Timer />
                <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    Choose a Word!
                </h2>
                <p className="text-gray-400 mb-8">What do you want to draw?</p>

                <div className="grid grid-cols-1 gap-4">
                    {room.turn.candidateWords.map((word) => (
                        <button
                            key={word}
                            onClick={() => handleSelectWord(word)}
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
