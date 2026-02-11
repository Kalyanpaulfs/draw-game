"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { createRoom, joinRoom } from "@/lib/room-actions";
import { cn } from "@/lib/game-utils";

function PlayPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userId, userName, saveName } = useUser();
    const [activeTab, setActiveTab] = useState<"create" | "join">("create");
    const [roomId, setRoomId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [players, setPlayers] = useState(4);
    const [rounds, setRounds] = useState(3);
    const [isPublic, setIsPublic] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const tab = searchParams.get("tab");
        if (tab === "join") {
            setActiveTab("join");
        }
    }, [searchParams]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim()) {
            setError("Please enter your name");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const id = await createRoom(userId, userName, {
                maxPlayers: players,
                rounds,
                isPublic,
            });
            router.push(`/room/${id}`);
        } catch (err) {
            setError("Failed to create room.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim()) {
            setError("Please enter your name");
            return;
        }
        if (!roomId.trim() || roomId.length !== 4) {
            setError("Invalid Room ID");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await joinRoom(roomId.toUpperCase(), userId, userName);
            if (res.success) {
                router.push(`/room/${roomId.toUpperCase()}`);
            } else {
                setError(res.message || "Failed to join room");
            }
        } catch (err) {
            setError("Failed to join room.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent_70%)] opacity-40"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150"></div>
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }}></div>
            </div>

            <div className={cn(
                "relative z-10 w-full max-w-[480px] p-6 transition-all duration-1000 ease-out",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
                {/* Header */}
                <div className="text-center mb-10 space-y-3 relative group cursor-default">

                    <Link href="/" className="inline-block cursor-pointer">
                        <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-lg scale-100 group-hover:scale-105 transition-transform duration-500">
                            Pixxi<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Pop</span>
                        </h1>
                    </Link>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <Link href="/" className="hover:text-indigo-400 transition-colors">← Back to Home</Link>
                    </div>
                </div>

                {/* Minimalist Card */}
                <div className="relative group backdrop-blur-2xl bg-slate-900/40 border border-white/10 rounded-[2rem] p-1 shadow-2xl shadow-black/40 ring-1 ring-white/5 overflow-hidden">
                    {/* Gloss shine */}
                    <div className="absolute -inset-[100%] bg-gradient-to-br from-white/5 to-transparent rotate-45 pointer-events-none opacity-50 group-hover:opacity-100 transition duration-700"></div>

                    <div className="relative bg-slate-950/30 rounded-[1.8rem] p-6 sm:p-8">

                        {/* Tab Switcher */}
                        <div className="grid grid-cols-2 p-1.5 bg-black/40 rounded-2xl mb-8 border border-white/5 relative">
                            <div className={cn(
                                "absolute top-1.5 bottom-1.5 rounded-xl bg-slate-800 shadow-lg border border-white/10 transition-all duration-300 ease-out",
                                activeTab === "create" ? "left-1.5 right-[50%]" : "left-[50%] right-1.5"
                            )}></div>

                            <button
                                onClick={() => setActiveTab("create")}
                                className={cn(
                                    "relative z-10 py-2.5 text-sm font-bold tracking-wide transition-colors duration-200",
                                    activeTab === "create" ? "text-white" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setActiveTab("join")}
                                className={cn(
                                    "relative z-10 py-2.5 text-sm font-bold tracking-wide transition-colors duration-200",
                                    activeTab === "join" ? "text-white" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Join
                            </button>
                        </div>

                        <div className="space-y-6">

                            {/* Identity Field */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">👤</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => saveName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:bg-slate-800/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all duration-300 shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="min-h-[220px]">
                                {activeTab === "create" ? (
                                    <form onSubmit={handleCreate} className="space-y-6 animate-fadeIn">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Players</label>
                                                <div className="relative">
                                                    <select
                                                        value={players}
                                                        onChange={(e) => setPlayers(Number(e.target.value))}
                                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:bg-slate-800/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none appearance-none cursor-pointer transition-all shadow-inner font-medium text-sm"
                                                    >
                                                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n} className="bg-slate-900">{n}</option>)}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rounds</label>
                                                <div className="relative">
                                                    <select
                                                        value={rounds}
                                                        onChange={(e) => setRounds(Number(e.target.value))}
                                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:bg-slate-800/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none appearance-none cursor-pointer transition-all shadow-inner font-medium text-sm"
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n} className="bg-slate-900">{n}</option>)}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                                                </div>
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors -mx-2">
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 shadow",
                                                isPublic ? "bg-indigo-500 border-indigo-500 shadow-indigo-500/50" : "bg-slate-900 border-slate-600 group-hover:border-slate-400"
                                            )}>
                                                {isPublic && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                                            <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colorsSelect">Public Room</span>
                                        </label>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group relative w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        Initializing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Create Sanctuary <span className="group-hover:translate-x-1 transition-transform">✨</span>
                                                    </>
                                                )}
                                            </span>
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleJoin} className="space-y-8 animate-fadeIn">
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Code</label>
                                            <div className="relative group/code">
                                                <input
                                                    type="text"
                                                    value={roomId}
                                                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                                    placeholder="ABCD"
                                                    maxLength={4}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-4 text-3xl font-black font-mono text-center tracking-[0.5em] text-white placeholder-slate-700/50 focus:bg-slate-800/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all duration-300 uppercase shadow-inner"
                                                />
                                                {/* Decorative corner accents for code input */}
                                                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-white/10 group-focus-within/code:border-indigo-500/50 transition-colors"></div>
                                                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-white/10 group-focus-within/code:border-indigo-500/50 transition-colors"></div>
                                                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-white/10 group-focus-within/code:border-indigo-500/50 transition-colors"></div>
                                                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-white/10 group-focus-within/code:border-indigo-500/50 transition-colors"></div>
                                            </div>

                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group relative w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {loading ? "Connecting..." : <>Enter Void <span className="group-hover:translate-x-1 transition-transform">🚀</span></>}
                                            </span>
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        </button>
                                    </form>
                                )}
                            </div>

                            {error && (
                                <div className="text-center animate-shake">
                                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20 inline-flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                        {error}
                                    </span>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="h-1.5 w-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="h-1.5 w-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-1.5 w-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>

            <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
        .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
        </main>
    );
}

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <PlayPageContent />
        </Suspense>
    );
}
