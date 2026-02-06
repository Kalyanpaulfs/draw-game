"use client";

import { useState } from "react";
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
    } catch (err: any) {
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
    } catch (err: any) {
      setError("Failed to join room. Check connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Draw & Guess
          </h1>
          <p className="mt-2 text-gray-400">Real-time multiplayer drawing game</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
          <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("create")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === "create" ? "bg-gray-600 text-white shadow" : "text-gray-400 hover:text-white"
              )}
            >
              Create Game
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === "join" ? "bg-gray-600 text-white shadow" : "text-gray-400 hover:text-white"
              )}
            >
              Join Game
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => saveName(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white outline-none"
              />
            </div>

            {activeTab === "create" ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Max Players</label>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={players}
                      onChange={(e) => setPlayers(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Rounds</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={rounds}
                      onChange={(e) => setRounds(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="public" className="ml-2 text-sm text-gray-300">
                    Public Room
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg font-bold text-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Room"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Room Code</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    maxLength={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white outline-none uppercase tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-lg font-bold text-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Joining..." : "Join Game"}
                </button>
              </form>
            )}

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
