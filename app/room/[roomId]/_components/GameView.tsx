"use client";

import { Room } from "@/lib/types";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useUser } from "@/hooks/useUser";
import { useCanvas } from "@/hooks/useCanvas";
import { useChat } from "@/hooks/useChat";
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
        undo,
        redo
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
        <div className="w-full h-full flex flex-col bg-[#1a56db] overflow-hidden font-sans select-none">
            <WordSelector room={room} />

            {/* Premium Mobile Header */}
            <div className="h-16 shrink-0 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur-md border-b border-white/5 relative z-40 shadow-sm">
                {/* Left: Timer */}
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                            <path className="text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path
                                className="text-indigo-500 transition-[stroke-dasharray] duration-1000 ease-linear"
                                strokeDasharray={`${(timeLeft / totalDuration) * 100}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className={cn("text-sm font-bold relative z-10", timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white")}>{timeLeft}</span>
                    </div>
                </div>

                {/* Center: Word */}
                <div className="flex-1 flex justify-center px-2">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full flex gap-2 items-center justify-center min-w-[120px] max-w-full shadow-[0_0_15px_-3px_rgba(99,102,241,0.1)] backdrop-blur-sm">
                        <span className="font-mono text-sm sm:text-lg font-bold tracking-[0.15em] text-indigo-300 uppercase truncate">
                            {(() => {
                                if (room.turn?.phase === "choosing_difficulty") return "WAITING";
                                if (room.turn?.phase === "choosing_word") return "CHOOSING";
                                if (isDrawer) return room.turn?.secretWord || "...";
                                return room.turn?.secretWord?.replace(/./g, "_") || "____";
                            })()}
                        </span>
                        <div className="bg-indigo-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded text-indigo-300 shrink-0">
                            {room.turn?.secretWord?.length || 0}
                        </div>
                    </div>
                </div>

                {/* Right: Round */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end opacity-60">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Code</span>
                        <span className="text-xs font-bold text-indigo-400 select-all font-mono">{room.roomId}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Round</span>
                        <span className="text-xs font-bold text-white leading-none mt-0.5">{room.currentRound}<span className="text-slate-700 mx-0.5">/</span>{room.config.rounds}</span>
                    </div>
                </div>
            </div>

            {/* Drawer Toolbar - Compact Static */}
            {isDrawer && room.turn?.phase === "drawing" && (
                <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-3 z-30 shadow-sm overflow-x-auto no-scrollbar justify-between">
                    {/* Tools Group */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={undo} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700" title="Undo">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button onClick={redo} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700" title="Redo">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-200 shrink-0"></div>

                    {/* Size Slider */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <input
                            type="range"
                            min="2"
                            max="20"
                            value={size}
                            onChange={(e) => setSize(parseInt(e.target.value))}
                            className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                        />
                        <div className="w-5 h-5 flex items-center justify-center">
                            <div className="rounded-full bg-slate-900" style={{ width: Math.max(2, size / 1.5), height: Math.max(2, size / 1.5), backgroundColor: color }}></div>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-slate-200 shrink-0"></div>

                    {/* Colors (Scrollable) */}
                    <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar items-center px-1 mask-linear-fade">
                        {["#000000", "#555555", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e", "#78350f", "#ffffff"].map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={cn(
                                    "w-6 h-6 shrink-0 rounded-full border border-slate-200/50 cursor-pointer transition-transform hover:scale-110",
                                    color === c ? "ring-2 ring-slate-900 ring-offset-1 scale-110 z-10" : ""
                                )}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>

                    <div className="w-px h-6 bg-slate-200 shrink-0"></div>

                    {/* Trash */}
                    <button onClick={clearBoard} className="p-1.5 rounded-full hover:bg-red-50 text-red-500 shrink-0" title="Clear Board">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )}

            {/* Main Content: Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-1 min-h-0 bg-[#3b72f0]/30 relative overflow-hidden">
                <div className="bg-white rounded-lg shadow-xl border-[4px] border-slate-900/10 overflow-hidden w-full h-full relative flex items-center justify-center shrink-0">
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
                </div>
            </div>

            {/* Bottom Panel: Players & Chat */}
            <div className="h-[45%] shrink-0 bg-[#1a56db] p-2 pt-0 flex gap-2 min-h-[250px]">

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
                                className="w-full bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-900 placeholder-slate-500 font-bold"
                                disabled={isDrawer}
                            />
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
