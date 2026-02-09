"use client";

import { Room, Player } from "@/lib/types";
import { resetGame } from "@/lib/room-actions";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function GameOverView({ room }: { room: Room }) {
    const { userId } = useUser();
    const players = Object.values(room.players).sort(
        (a, b) => b.score - a.score
    );

    const [first, second, third, ...others] = players;
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        setShowConfetti(true);
    }, []);

    const handleReset = async () => {
        await resetGame(room.roomId);
    };

    return (
        <div className="relative min-h-[100dvh] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden font-sans selection:bg-white/20">
            {/* Enhanced Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-gradient-radial from-indigo-500/15 via-purple-500/10 to-transparent blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[50%] h-[40%] bg-gradient-radial from-violet-500/10 to-transparent blur-[100px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
            </div>

            {/* Premium Confetti */}
            {showConfetti && (
                <div className="pointer-events-none absolute inset-0 z-30">
                    {[...Array(40)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                width: `${Math.random() * 8 + 4}px`,
                                height: `${Math.random() * 8 + 4}px`,
                                backgroundColor: [
                                    "#FFD700",
                                    "#FFA500",
                                    "#FF6B9D",
                                    "#C77DFF",
                                    "#4CC9F0",
                                ][Math.floor(Math.random() * 5)],
                                borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                                animationDuration: `${Math.random() * 4 + 4}s`,
                                animationDelay: `${Math.random() * 2}s`,
                                opacity: 0.7,
                                boxShadow: "0 0 10px rgba(255,255,255,0.5)",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Main Content - Fixed for mobile browsers */}
            <main className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-6 pb-safe">
                {/* Header Section */}
                <header className="flex flex-col items-center justify-center pt-8 md:pt-12 pb-6 md:pb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4 animate-fade-in">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] md:text-xs font-medium tracking-wider uppercase text-white/60">
                            Match Complete
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 mb-3 animate-slide-up">
                        VICTORY
                    </h1>

                    <div className="flex items-center gap-2 opacity-40">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent via-white to-transparent" />
                        <div className="w-1 h-1 rounded-full bg-white" />
                        <div className="h-px w-12 bg-gradient-to-r from-white via-white to-transparent" />
                    </div>
                </header>

                {/* Podium Section - Responsive heights */}
                <section className="w-full flex items-end justify-center gap-2 md:gap-8 mb-6 md:mb-8" style={{ height: 'clamp(280px, 40vh, 400px)' }}>
                    {/* Second Place */}
                    <div className="flex-1 max-w-[140px] flex justify-center items-end">
                        {second && <PodiumStep player={second} rank={2} />}
                    </div>

                    {/* First Place */}
                    <div className="flex-1 max-w-[160px] flex justify-center items-end z-10">
                        {first && <PodiumStep player={first} rank={1} />}
                    </div>

                    {/* Third Place */}
                    <div className="flex-1 max-w-[140px] flex justify-center items-end">
                        {third && <PodiumStep player={third} rank={3} />}
                    </div>
                </section>

                {/* Other Players - Compact Card Style */}
                {others.length > 0 && (
                    <div className="w-full max-w-2xl mx-auto mb-6 md:mb-8">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6">
                            <h3 className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-4">
                                Other Players
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {others.map((p, idx) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between gap-3 bg-white/5 rounded-lg px-3 py-2.5 border border-white/5 hover:border-white/20 transition-all"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xl flex-shrink-0">{p.avatar}</span>
                                            <span className="text-xs md:text-sm font-medium text-white/80 truncate">
                                                {p.name}
                                            </span>
                                        </div>
                                        <span className="font-mono text-xs md:text-sm font-bold text-indigo-300 flex-shrink-0">
                                            {p.score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions - Fixed for mobile bottom bars */}
                <footer className="w-full flex flex-col items-center gap-4 pb-8 md:pb-12 safe-bottom">
                    {room.hostId === userId ? (
                        <button
                            onClick={handleReset}
                            className="group relative px-8 md:px-12 py-3.5 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm md:text-base font-bold tracking-wider uppercase rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70"
                        >
                            <span className="relative flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Play Again
                            </span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0s" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.2s" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.4s" }} />
                            </div>
                            <span className="text-xs font-medium tracking-wider text-white/50 uppercase">
                                Waiting for host
                            </span>
                        </div>
                    )}

                    <Link
                        href="/"
                        className="group flex items-center gap-2 text-xs md:text-sm font-medium text-white/40 hover:text-white transition-colors uppercase tracking-wider"
                    >
                        <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Menu
                    </Link>
                </footer>
            </main>

            {/* Global Styles */}
            <style jsx global>{`
                @keyframes fall {
                    0% { 
                        transform: translateY(-20px) rotate(0deg); 
                        opacity: 0; 
                    }
                    10% { 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateY(100vh) rotate(720deg); 
                        opacity: 0; 
                    }
                }
                
                @keyframes fade-in {
                    from { 
                        opacity: 0; 
                        transform: translateY(10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                
                @keyframes slide-up {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                
                .animate-fall {
                    animation: fall linear forwards;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }
                
                .animate-slide-up {
                    animation: slide-up 0.8s ease-out forwards;
                }
                
                .safe-bottom {
                    padding-bottom: max(2rem, env(safe-area-inset-bottom));
                }
                
                @supports (padding: max(0px)) {
                    .pb-safe {
                        padding-bottom: max(1rem, env(safe-area-inset-bottom));
                    }
                }
            `}</style>
        </div>
    );
}

function PodiumStep({
    player,
    rank,
}: {
    player: Player;
    rank: 1 | 2 | 3;
}) {
    const isWinner = rank === 1;

    const config = {
        1: {
            color: "from-amber-400 via-yellow-300 to-amber-500",
            textColor: "text-amber-400",
            height: "h-[60%]",
            bgGradient: "bg-gradient-to-b from-amber-500/20 via-amber-600/10 to-transparent",
            borderColor: "border-amber-400/30",
            icon: "👑",
            glowColor: "shadow-amber-500/50",
            avatarSize: "text-5xl md:text-7xl",
            rankText: "1st",
        },
        2: {
            color: "from-slate-300 via-gray-200 to-slate-400",
            textColor: "text-slate-300",
            height: "h-[45%]",
            bgGradient: "bg-gradient-to-b from-slate-400/15 via-slate-500/8 to-transparent",
            borderColor: "border-slate-400/20",
            icon: "🥈",
            glowColor: "shadow-slate-500/30",
            avatarSize: "text-4xl md:text-5xl",
            rankText: "2nd",
        },
        3: {
            color: "from-orange-400 via-amber-600 to-orange-500",
            textColor: "text-orange-400",
            height: "h-[35%]",
            bgGradient: "bg-gradient-to-b from-orange-500/15 via-orange-600/8 to-transparent",
            borderColor: "border-orange-400/20",
            icon: "🥉",
            glowColor: "shadow-orange-500/30",
            avatarSize: "text-4xl md:text-5xl",
            rankText: "3rd",
        },
    }[rank];

    return (
        <div className="w-full flex flex-col items-center justify-end h-full group">
            {/* Avatar & Medal */}
            <div className={`flex flex-col items-center mb-3 md:mb-4 transition-transform duration-500 ${isWinner ? 'group-hover:-translate-y-2' : 'group-hover:-translate-y-1'}`}>
                {isWinner && (
                    <div className="text-3xl md:text-4xl mb-2 animate-bounce">
                        {config.icon}
                    </div>
                )}

                <div className={`relative ${config.avatarSize} filter drop-shadow-2xl mb-2`}>
                    <div className={`absolute inset-0 blur-xl opacity-50 bg-gradient-to-b ${config.color}`} />
                    <div className="relative">{player.avatar}</div>
                </div>

                {!isWinner && (
                    <span className="text-xl md:text-2xl mb-1">{config.icon}</span>
                )}
            </div>

            {/* Podium Bar */}
            <div className={`
                w-full ${config.height} relative
                flex flex-col items-center justify-start pt-4 md:pt-6 px-2
                ${config.bgGradient}
                border-t-2 border-x ${config.borderColor}
                backdrop-blur-md rounded-t-xl
                transition-all duration-500
                ${isWinner ? 'group-hover:scale-105' : 'group-hover:scale-102'}
                shadow-2xl ${config.glowColor}
            `}>
                {/* Rank Badge */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r ${config.color} text-slate-900 text-[10px] md:text-xs font-black tracking-wider shadow-lg`}>
                    {config.rankText}
                </div>

                {/* Score */}
                <div className={`font-black text-3xl md:text-5xl tracking-tighter bg-gradient-to-b ${config.color} bg-clip-text text-transparent mb-1 md:mb-2 drop-shadow-lg`}>
                    {player.score}
                </div>

                {/* Player Name */}
                <div className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/70 max-w-[90%] truncate text-center px-1">
                    {player.name}
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Bottom Fade */}
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}