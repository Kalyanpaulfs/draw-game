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

        try {
            await submitGuess(room.roomId, userId, userName || "Anon", guess);
            setGuess("");
        } catch (e) {
            console.error(e);
        }
    };

    if (!room.turn) return null;

    const totalDuration = room.turn?.phase === "drawing" ? 60 : 15;

    return (
        <div className="w-full h-[100dvh] flex flex-col bg-[#1a56db] overflow-hidden font-sans select-none">
            <WordSelector room={room} />

            {/* Classic Header */}
            <div className="h-14 shrink-0 flex items-center justify-between px-3 gap-2 bg-[#1a56db] relative z-20">
                {/* Left: Timer & Icons */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center font-bold text-xl text-slate-900 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-slate-200 h-full" style={{ top: `${(1 - timeLeft / totalDuration) * 100}%` }}></div>
                        <span className="relative z-10">{timeLeft}</span>
                    </div>
                </div>

                {/* Center: Word */}
                <div className="flex-1 flex justify-center">
                    <div className="bg-[#f0e68c] px-4 py-1 rounded border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)] flex gap-2 items-center min-w-[120px] justify-center">
                        <span className="font-mono text-lg font-bold tracking-[0.2em] text-slate-900 uppercase">
                            {(() => {
                                if (room.turn?.phase === "choosing_difficulty") return "WAITING";
                                if (room.turn?.phase === "choosing_word") return "CHOOSING";
                                if (isDrawer) return room.turn?.secretWord || "...";
                                return room.turn?.secretWord?.replace(/./g, "_") || "____";
                            })()}
                        </span>
                        <div className="bg-yellow-100 text-[10px] font-bold px-1 rounded border border-yellow-600 text-yellow-800">
                            {room.turn?.secretWord?.length || 0}
                        </div>
                    </div>
                </div>

                {/* Right: Round & Icons */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-900 flex flex-col items-center justify-center text-[8px] font-bold text-slate-900 shadow-sm leading-tight">
                        <span>RND</span>
                        <span className="text-sm">{room.currentRound}/{room.config.rounds}</span>
                    </div>
                </div>
            </div>

            {/* Main Content: Canvas */}
            <div className="flex-1 flex flex-col items-center justify-start p-2 min-h-0 bg-[#3b72f0]/30 relative overflow-y-auto">
                <div className="bg-white rounded-lg shadow-xl border-[4px] border-slate-900/10 overflow-hidden w-full max-w-lg aspect-square relative flex items-center justify-center shrink-0">
                    <canvas
                        ref={canvasRef}
                        width={1200}
                        height={1200}
                        className="w-full h-full object-contain cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />

                    {/* Choosing Word Overlay */}
                    {room.turn?.phase === "choosing_word" && !isDrawer && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-start pt-10 z-10">
                            <div className="bg-white p-4 rounded-xl border-4 border-slate-900 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
                                <span className="text-6xl">{room.players[room.turn.drawerId]?.avatar}</span>
                                <div className="text-center">
                                    <div className="font-black text-xl text-slate-900">{drawerName}</div>
                                    <div className="font-bold text-slate-500 text-sm">is choosing a word...</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Drawer Toolbar Overlay */}
                    {isDrawer && room.turn?.phase === "drawing" && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-100/90 backdrop-blur rounded-full border border-slate-300 shadow-lg p-2 flex gap-3 items-center scale-90 origin-top z-20">
                            {["#000000", "#EF4444", "#3B82F6", "#22C55E", "#EAB308"].map((c) => (
                                <div key={c} onClick={() => setColor(c)} className={cn("w-6 h-6 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition-transform", color === c ? "ring-2 ring-black scale-110" : "")} style={{ backgroundColor: c }} />
                            ))}
                            <div className="w-px h-5 bg-slate-300"></div>
                            <button onClick={clearBoard} className="text-sm bg-white p-1 rounded hover:bg-red-50 text-red-500 border border-slate-200">🗑️</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Panel: Players & Chat */}
            <div className="h-[35%] shrink-0 bg-[#1a56db] p-2 pt-0 flex gap-2">

                {/* Left: Players */}
                <div className="w-5/12 bg-white rounded-t-lg border-2 border-b-0 border-slate-900 overflow-hidden flex flex-col">
                    <div className="bg-slate-100 p-1 border-b border-slate-200 text-center text-[10px] font-bold uppercase text-slate-500">Players</div>
                    <div className="flex-1 overflow-y-auto p-1 space-y-1">
                        {Object.values(room.players)
                            .sort((a, b) => b.score - a.score)
                            .map((p, i) => (
                                <div key={p.id} className={cn(
                                    "flex items-center p-1 rounded border shadow-sm relative pr-6",
                                    p.id === room.turn?.drawerId ? "bg-orange-50 border-orange-200" : "bg-white border-slate-100"
                                )}>
                                    <div className="text-lg mr-1">{p.avatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn("text-[11px] font-bold truncate leading-tight", p.id === userId ? "text-blue-600" : "text-slate-900")}>{p.name}</div>
                                        <div className="text-[9px] text-slate-500 font-bold leading-tight">{p.score}</div>
                                    </div>
                                    <div className="absolute top-1 right-1 text-[9px] font-black text-slate-300">#{i + 1}</div>
                                    {isDrawer && p.id === room.turn?.drawerId && <div className="absolute right-1 bottom-1 text-[10px]">✏️</div>}
                                </div>
                            ))}
                    </div>
                </div>

                {/* Right: Chat */}
                <div className="w-7/12 bg-white rounded-t-lg border-2 border-b-0 border-slate-900 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50 text-xs">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn(
                                "leading-tight break-words",
                                msg.isSystem ? (msg.text.includes("guessed") ? "text-green-600 font-bold bg-green-50 p-1 rounded" : "text-blue-600 font-bold text-center my-1") : "text-slate-800"
                            )}>
                                {!msg.isSystem && <span className="font-bold text-slate-900">{msg.userName}: </span>}
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t border-slate-200 bg-white">
                        <form onSubmit={handleGuess} className="flex gap-1">
                            <input
                                type="text"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                placeholder={isDrawer ? "It's your turn!" : "Type guess here..."}
                                className="w-full bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                disabled={isDrawer}
                            />
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
