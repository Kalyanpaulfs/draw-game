"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRoom } from "@/hooks/useRoom";
import { useUser } from "@/hooks/useUser";
import { joinRoom } from "@/lib/room-actions";
import { Room } from "@/lib/types";
import { LobbyView } from "./_components/LobbyView";
import GameView from "./_components/GameView";
import GameOverView from "./_components/GameOverView";
import { VoiceProvider } from "@/lib/voice";
import { MicButton } from "./_components/MicButton";

import { LeaveModal } from "@/app/_components/LeaveModal";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const router = useRouter();
    const { room, loading: roomLoading, error: roomError } = useRoom(roomId);
    const { userId, userName, saveName } = useUser();

    const [joinName, setJoinName] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState("");
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    useEffect(() => {
         
        if (userName) setJoinName(userName);
    }, [userName]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinName.trim()) {
            setJoinError("Enter a name");
            return;
        }
        setIsJoining(true);
        setJoinError("");

        saveName(joinName);
        const res = await joinRoom(roomId, userId, joinName);
        if (!res.success) {
            setJoinError(res.message || "Failed to join");
        }
        setIsJoining(false);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Copied to clipboard!");
    };

    if (roomLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin-slow"></div>
                </div>
                <p className="text-slate-400 text-sm font-medium tracking-widest uppercase animate-pulse">Syncing Room...</p>
            </div>
        </div>
    );
    if (roomError) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
                <p className="text-red-300/80 text-sm">{roomError}</p>
                <Link href="/" className="mt-6 inline-block px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-500/20">Return Home</Link>
            </div>
        </div>
    );
    if (!room) return null;

    const isPlayer = !!room.players[userId];
    const playerCount = Object.keys(room.players).length;

    // Not signed in / Not joined yet
    if (!isPlayer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200 overflow-hidden relative font-sans">
                {/* Background Effects */}
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-20"></div>
                <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>

                {/* Content */}
                <div className="relative z-10 w-full max-w-md p-8">
                    <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                        <div className="text-center mb-8 relative">
                            <div className="inline-block p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 mb-4 shadow-inner">
                                <span className="text-3xl">👋</span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Join Room</h1>
                            <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">Room Code: <span className="text-indigo-400">{roomId}</span></p>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-5 relative">
                            <div className="space-y-2">
                                <label className="text-[11px] uppercase tracking-widest text-slate-500 font-bold ml-1">Your Alias</label>
                                <input
                                    type="text"
                                    value={joinName}
                                    onChange={(e) => setJoinName(e.target.value)}

                                    className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white placeholder-slate-600 outline-none transition-all duration-300 font-medium"
                                    placeholder="Enter your name..."
                                />
                            </div>

                            {joinError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    <p className="text-red-400 text-xs font-semibold">{joinError}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isJoining}
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                            >
                                {isJoining ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connecting...
                                    </span>
                                ) : "Enter Game"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Signed in - Render Main Layout
    const peerIds = Object.keys(room.players).filter(id => id !== userId);

    return (
        <VoiceProvider roomId={roomId} userId={userId} peerIds={peerIds}>
            <div className="h-[100dvh] bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col relative">
                {/* Background Effects */}
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-20"></div>
                <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
                <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>



                {/* Glass Header - Only show when not playing (Lobby/GameOver) */}
                {room.status !== "playing" && (
                    <header className="relative z-10 px-6 py-4 border-b border-white/5 bg-slate-900/60 backdrop-blur-2xl flex justify-between items-center shadow-2xl">
                        {/* Left: Room Code */}
                        <div className="flex items-center gap-6">
                            <div className="group relative">
                                <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative flex flex-col">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-0.5">Room Code</span>
                                    <div className="flex items-baseline gap-2">
                                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 tracking-tight leading-none filter drop-shadow-lg">
                                            {roomId}
                                        </h1>
                                        <button
                                            onClick={copyLink}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-indigo-400"
                                            title="Copy Code"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2 hidden sm:block"></div>

                            {/* Center: Player Count Pill */}
                            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-800/40 border border-white/5 rounded-full backdrop-blur-md shadow-inner">
                                <div className="relative">
                                    <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                                    <span className="relative block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                </div>
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    <span className="text-white">{playerCount}</span>
                                    <span className="text-slate-600 mx-1">/</span>
                                    <span className="text-slate-500">{room.config.maxPlayers}</span>
                                    <span className="ml-2 text-slate-500">Players</span>
                                </span>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={copyLink}
                                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all duration-300 transform active:scale-[0.98]"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    Invite
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </button>

                            <button
                                onClick={() => setShowLeaveModal(true)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all duration-300 group"
                                title="Leave Room"
                            >
                                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </div>
                    </header>
                )}

                {/* Main Content Area */}
                <main className={`relative z-10 flex-1 flex flex-col items-center justify-center w-full mx-auto ${room.status === "playing" ? "h-full p-0 max-w-none" : "p-4 md:p-6 max-w-7xl"}`}>
                    {room.status === "playing" ? (
                        <div className="w-full h-full">
                            <GameView room={room} />
                        </div>
                    ) : room.status === "finished" ? (
                        <GameOverView room={room} />
                    ) : (
                        <LobbyView room={room} userId={userId} roomId={roomId} />
                    )}
                </main>

                <LeaveModal
                    isOpen={showLeaveModal}
                    onClose={() => setShowLeaveModal(false)}
                    onConfirm={() => {
                        import("@/lib/room-actions").then(mod => {
                            mod.leaveRoom(roomId, userId).then(() => router.push("/"));
                        });
                    }}
                />

                {/* Floating Mic Button */}
                <MicButton />
            </div>
        </VoiceProvider>
    );
}
