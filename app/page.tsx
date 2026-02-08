"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { createRoom, joinRoom } from "@/lib/room-actions";
import { cn } from "@/lib/game-utils";

export default function Home() {
  const router = useRouter();
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
  }, []);

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
      setError("Failed to create room. Firebase config might be missing.");
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
      setError("Failed to join room. Check connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-[radial-gradient(circle_at_100%_100%,rgba(76,29,149,0.05),transparent_60%)]"></div>
      </div>

      <div className={cn(
        "relative z-10 w-full max-w-lg p-6 transition-all duration-1000 ease-out",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        {/* Header */}
        <div className="text-center mb-12 space-y-2">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white drop-shadow-sm">
            Pixxi<span className="text-indigo-500">Pop</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-wide text-sm uppercase opacity-80">
            Premium Real-Time Collaboration
          </p>
        </div>

        {/* Minimalist Card */}
        <div className="backdrop-blur-3xl bg-slate-900/50 border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50 ring-1 ring-white/5">

          {/* Tab Switcher */}
          <div className="flex p-1 bg-black/20 rounded-xl mb-8 border border-white/5">
            <button
              onClick={() => setActiveTab("create")}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300",
                activeTab === "create" ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Create
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300",
                activeTab === "join" ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Join
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Identity</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => saveName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-transparent border-b border-white/10 px-4 py-3 text-lg font-medium text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="min-h-[220px]">
              {activeTab === "create" ? (
                <form onSubmit={handleCreate} className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Players</label>
                      <div className="relative">
                        <select
                          value={players}
                          onChange={(e) => setPlayers(Number(e.target.value))}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n} className="bg-slate-900">{n}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">↓</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Rounds</label>
                      <div className="relative">
                        <select
                          value={rounds}
                          onChange={(e) => setRounds(Number(e.target.value))}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n} className="bg-slate-900">{n}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">↓</div>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      isPublic ? "bg-indigo-500 border-indigo-500" : "border-slate-600 group-hover:border-slate-400"
                    )}>
                      {isPublic && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" className="hidden" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                    <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Public Room</span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold text-base hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                  >
                    {loading ? "Initializing..." : "Create Sanctuary"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-8 animate-fadeIn">
                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Access Code</label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      placeholder="ABCD"
                      maxLength={4}
                      className="w-full bg-transparent border-b border-white/10 px-4 py-3 text-3xl font-mono text-center tracking-[0.5em] text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-colors uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                  >
                    {loading ? "Connecting..." : "Enter Void"}
                  </button>
                </form>
              )}
            </div>

            {error && (
              <div className="text-center">
                <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  {error}
                </span>
              </div>
            )}

          </div>
        </div>

        <div className="mt-12 flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Simple footer decorations or brand logos could go here */}
          <div className="h-1 w-1 bg-white rounded-full"></div>
          <div className="h-1 w-1 bg-white rounded-full"></div>
          <div className="h-1 w-1 bg-white rounded-full"></div>
        </div>
      </div>
    </main>
  );
}
