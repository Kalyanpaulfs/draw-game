"use client";

import { Room } from "@/lib/types";
import { resetGame } from "@/lib/room-actions";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/game-utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function GameOverView({ room }: { room: Room }) {
    const { userId } = useUser();
    const sortedPlayers = Object.values(room.players).sort((a, b) => b.score - a.score);
    const [first, second, third, ...others] = sortedPlayers;
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        setShowConfetti(true);
    }, []);

    const handleReset = async () => {
        await resetGame(room.roomId);
    };

    return (
        <div className="w-full h-full min-h-[100dvh] flex flex-col items-center justify-between p-4 relative overflow-y-auto custom-scrollbar">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none fixed">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-gradient-to-b from-purple-600/20 to-transparent blur-[100px]"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse-slow"></div>
                <div className="absolute top-20 left-10 w-24 h-24 bg-pink-500/20 blur-[50px] rounded-full animate-float"></div>
            </div>

            {/* CSS Confetti (Simple Implementation) */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden fixed z-50">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-fall"
                            style={{
                                top: '-20px',
                                left: `${Math.random() * 100}%`,
                                backgroundColor: ['#F472B6', '#818CF8', '#A78BFA', '#34D399', '#FBBF24'][Math.floor(Math.random() * 5)],
                                animationDuration: `${Math.random() * 3 + 2}s`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        ></div>
                    ))}
                </div>
            )}

            {/* Content Wrapper for centering vertical content - Reduced padding */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl py-2 md:py-8">
                <div className="relative z-10 text-center mb-4 md:mb-10">
                    <span className="inline-block py-0.5 px-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-bold tracking-widest uppercase mb-2 animate-fade-in-up">
                        Match Complete
                    </span>
                    <h1 className="text-5xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)] tracking-tighter animate-scale-in leading-tight">
                        GAME OVER
                    </h1>
                </div>

                {/* Podium - More compact on mobile */}
                <div className="flex items-end justify-center gap-2 md:gap-8 w-full mb-6 md:mb-12 perspective-1000 transform scale-90 md:scale-100 origin-bottom">
                    {/* 2nd Place */}
                    {second && (
                        <div className="flex flex-col items-center group animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <div className="relative mb-1 md:mb-4 transition-transform duration-500 group-hover:-translate-y-3">
                                <div className="text-3xl md:text-6xl drop-shadow-2xl grayscale-[0.2] transform scale-90">
                                    {second.avatar}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-slate-700 text-white text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border-2 border-slate-800">2</div>
                            </div>
                            <div className="w-16 md:w-32 h-24 md:h-44 bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-t-2xl flex flex-col items-center justify-end pb-2 md:pb-4 relative overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80"></div>
                                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-50"></div>
                                <span className="relative z-10 font-bold text-slate-300 truncate max-w-[90%] text-[10px] md:text-sm mb-0.5">{second.name}</span>
                                <span className="relative z-10 font-mono font-black text-sm md:text-xl text-white">{second.score}</span>
                            </div>
                        </div>
                    )}

                    {/* 1st Place */}
                    {first && (
                        <div className="flex flex-col items-center z-20 group animate-slide-up">
                            <div className="relative mb-2 md:mb-6 transition-transform duration-500 group-hover:-translate-y-4 group-hover:scale-110">
                                <div className="text-5xl md:text-8xl drop-shadow-[0_10px_30px_rgba(234,179,8,0.5)] animate-bounce-slow">
                                    {first.avatar}
                                </div>
                                <div className="absolute -top-6 md:-top-12 left-1/2 -translate-x-1/2 text-3xl md:text-5xl animate-float">👑</div>
                            </div>
                            <div className="w-24 md:w-44 h-36 md:h-64 bg-gradient-to-b from-yellow-500/20 to-indigo-900/40 backdrop-blur-xl border border-yellow-500/30 rounded-t-3xl flex flex-col items-center justify-end pb-3 md:pb-6 relative overflow-hidden shadow-[0_0_50px_-10px_rgba(234,179,8,0.3)]">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent"></div>
                                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>

                                {/* Confetti inside card */}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                                <span className="relative z-10 font-black text-sm md:text-2xl text-yellow-100 uppercase tracking-widest mb-1 truncate max-w-[90%]">{first.name}</span>
                                <div className="relative z-10 bg-yellow-500/20 text-yellow-200 px-2 md:px-4 py-1 md:py-1.5 rounded-full border border-yellow-500/30 backdrop-blur-sm">
                                    <span className="font-mono font-black text-lg md:text-2xl">{first.score}</span>
                                    <span className="text-[10px] md:text-xs font-bold ml-1 opacity-80">PTS</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {third && (
                        <div className="flex flex-col items-center group animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="relative mb-1 md:mb-4 transition-transform duration-500 group-hover:-translate-y-3">
                                <div className="text-3xl md:text-6xl drop-shadow-2xl grayscale-[0.4] sepia-[0.4] transform scale-90">
                                    {third.avatar}
                                </div>
                                <div className="absolute -bottom-1 -left-1 bg-orange-800 text-white text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border-2 border-orange-900">3</div>
                            </div>
                            <div className="w-16 md:w-32 h-20 md:h-36 bg-orange-900/20 backdrop-blur-xl border border-white/10 rounded-t-2xl flex flex-col items-center justify-end pb-2 md:pb-4 relative overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-900/40"></div>
                                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50"></div>
                                <span className="relative z-10 font-bold text-orange-200 truncate max-w-[90%] text-[10px] md:text-sm mb-0.5">{third.name}</span>
                                <span className="relative z-10 font-mono font-black text-sm md:text-xl text-white">{third.score}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Other Players List - Reduced height and margin */}
                {others.length > 0 && (
                    <div className="w-full max-w-lg mb-4 md:mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-1 border border-white/5">
                            <div className="max-h-24 md:max-h-40 overflow-y-auto custom-scrollbar p-1 md:p-2 space-y-1 md:space-y-2">
                                {others.map((p, i) => (
                                    <div key={p.id} className="flex items-center justify-between p-2 md:p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <span className="text-slate-600 font-black text-xs md:text-sm italic w-4 md:w-6 text-center group-hover:text-slate-400 transition-colors">{i + 4}</span>
                                            <span className="text-sm md:text-xl transform group-hover:scale-125 transition-transform duration-300">{p.avatar}</span>
                                            <span className="font-bold text-slate-300 text-xs md:text-base group-hover:text-white transition-colors">{p.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-slate-400 text-xs md:text-base group-hover:text-indigo-300 transition-colors">{p.score} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions - Fixed at bottom padding - made more compact */}
            <div className="flex flex-col gap-3 items-center w-full max-w-sm pb-4 md:pb-0 z-20 animate-fade-in-up shrink-0" style={{ animationDelay: '0.6s' }}>
                {room.hostId === userId ? (
                    <button
                        onClick={handleReset}
                        className="w-full group relative overflow-hidden py-3 md:py-4 px-8 rounded-2xl bg-white text-black font-black text-base md:text-lg tracking-wide hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
                            PLAY AGAIN
                        </span>
                    </button>
                ) : (
                    <div className="flex items-center gap-3 px-6 py-3 md:py-4 bg-slate-900/60 rounded-2xl border border-white/5 backdrop-blur-md w-full justify-center">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Waiting for host</span>
                    </div>
                )}

                <Link
                    href="/"
                    className="text-slate-500 hover:text-white transition-colors text-[10px] md:text-xs font-bold uppercase tracking-widest hover:underline decoration-indigo-500 decoration-2 underline-offset-4 py-1"
                >
                    Back to Main Menu
                </Link>
            </div>

            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
                }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-fall { animation: fall linear forwards; }
                .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-bounce-slow { animation: bounce 3s infinite; }
                .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(50px); }
                @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; transform: translateY(20px); }
                @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
                .animate-scale-in { animation: scaleIn 0.5s ease-out forwards; opacity: 0; transform: scale(0.9); }
                @keyframes scaleIn { to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}
