"use client";

import { Room } from "@/lib/types";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useUser } from "@/hooks/useUser";
import { useCanvas } from "@/hooks/useCanvas";
import { useChat } from "@/hooks/useChat"; // New hook implementation
import { submitGuess } from "@/lib/room-actions";
import { TurnTimer } from "./TurnTimer";
import { WordSelector } from "./WordSelector";
import { cn } from "@/lib/game-utils";
import { useState } from "react";

export default function GameView({ room }: { room: Room }) {
    const { userId, userName } = useUser();
    const { timeLeft } = useGameLoop(room, userId);
    const { messages } = useChat(room.roomId);

    const isDrawer = room.turn?.drawerId === userId;
    const drawerName = room.players[room.turn?.drawerId || ""]?.name;

    const {
        canvasRef,
        color,
        setColor,
        size,
        setSize,
        clearBoard,
        startDrawing,
        draw,
        stopDrawing,
    } = useCanvas(room.roomId, userId, isDrawer);

    const [guess, setGuess] = useState("");

    const handleGuess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guess.trim()) return;

        // Optimistic UI or wait? Best to wait for real-time update in MVP
        // But we should clear the input
        try {
            await submitGuess(room.roomId, userId, userName || "Anon", guess);
            setGuess("");
        } catch (e) {
            console.error(e);
        }
    };

    if (!room.turn) return null;

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col h-[calc(100vh-100px)] relative">
            <WordSelector room={room} />

            {/* Top Bar */}
            <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl mb-4 border border-gray-700 shadow-md">
                <div className="flex items-center gap-4">
                    <TurnTimer timeLeft={timeLeft} />
                    <div>
                        <div className="text-sm text-gray-400">Round {room.currentRound} / {room.config.rounds}</div>
                        <div className="text-xl font-bold text-white">
                            {isDrawer ? "🎨 IT'S YOUR TURN!" : `👀 ${drawerName} is drawing...`}
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    {/* Word Display (Placeholder for Phase 4) */}
                    <div className="text-2xl font-mono tracking-widest bg-gray-900 px-6 py-2 rounded-lg border border-gray-600">
                        {isDrawer ? (room.turn.secretWord || "CHOOSING...") : "_ _ _ _ _"}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 flex-1 overflow-hidden">
                {/* Left: Toolbar */}
                <div className={cn(
                    "w-16 bg-gray-800 rounded-xl border border-gray-700 hidden md:flex flex-col items-center py-4 gap-4 transition-all",
                    !isDrawer && "opacity-50 pointer-events-none grayscale"
                )}>
                    {/* Players Scoreboard (Icon Trigger or Mini-list?) */}
                    {/* Let's put scores above the tools for now, or maybe make the sidebar wider? */}
                    {/* Actually, the plan was "Players list on the left side". 
                        The current toolbar is w-16. Let's make a dedicated column if space permits, 
                        or just list avatars with scores.
                     */}
                    <div className="flex flex-col gap-2 w-full px-1 mb-4">
                        {Object.values(room.players)
                            .sort((a, b) => b.score - a.score)
                            .map((p) => (
                                <div key={p.id} className="relative group flex justify-center cursor-help">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2",
                                        p.id === room.turn?.drawerId ? "border-yellow-400" : "border-gray-600",
                                        room.turn?.correctGuessers?.includes(p.id) ? "bg-green-600 border-green-400" : "bg-gray-700"
                                    )}>
                                        {p.avatar}
                                    </div>
                                    {/* Tooltip for Name & Score */}
                                    <div className="absolute left-12 top-0 bg-black/90 p-2 rounded text-xs whitespace-nowrap hidden group-hover:block z-50">
                                        <div className="font-bold text-white">{p.name}</div>
                                        <div className="text-yellow-400">{p.score} pts</div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-gray-900 text-[10px] px-1 rounded-full text-white border border-gray-700">
                                        {p.score}
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="h-px w-10 bg-gray-700 my-2" />

                    {/* Colors */}
                    {["#000000", "#EF4444", "#3B82F6", "#22C55E", "#EAB308"].map((c) => (
                        <div
                            key={c}
                            onClick={() => setColor(c)}
                            className={cn(
                                "w-8 h-8 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform",
                                color === c ? "border-white scale-110 shadow-lg" : "border-gray-600"
                            )}
                            style={{ backgroundColor: c }}
                        />
                    ))}

                    <div className="h-px w-10 bg-gray-700 my-2" />

                    {/* Sizes */}
                    {[3, 6, 12].map((s) => (
                        <div
                            key={s}
                            onClick={() => setSize(s)}
                            className={cn(
                                "rounded-full bg-gray-400 cursor-pointer hover:bg-white transition-colors",
                                size === s ? "bg-white shadow-lg" : ""
                            )}
                            style={{ width: s * 1.5 + 10, height: s * 1.5 + 10 }}
                        />
                    ))}

                    <div className="h-px w-10 bg-gray-700 my-2" />

                    {/* Clear */}
                    <button
                        onClick={clearBoard}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Clear Board"
                    >
                        🗑️
                    </button>
                </div>

                {/* Center: Canvas Area */}
                <div className="flex-1 bg-white rounded-xl shadow-inner overflow-hidden relative border border-gray-600 touch-none">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="w-full h-full object-contain cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>

                {/* Right: Chat/Guesses */}
                <div className="w-80 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-700 font-bold bg-gray-750">Chat</div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-2 max-h-[400px]">
                        {messages.length === 0 && (
                            <div className="text-sm text-gray-400 italic text-center">Game started!</div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("text-sm", msg.isSystem ? "text-green-400 font-bold text-center my-1" : "text-white")}>
                                {msg.isSystem ? (
                                    <span>🎉 {msg.text}</span>
                                ) : (
                                    <span>
                                        <span className="font-bold text-gray-400">{msg.userName}: </span>
                                        {msg.text}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-700">
                        <form onSubmit={handleGuess}>
                            <input
                                type="text"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                placeholder="Type your guess..."
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={isDrawer}
                            />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
