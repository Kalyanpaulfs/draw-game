"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { useUser } from "@/hooks/useUser";
import { joinRoom } from "@/lib/room-actions";
import { LobbyView } from "./_components/LobbyView";
import GameView from "./_components/GameView";
import GameOverView from "./_components/GameOverView";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const router = useRouter();
    const { room, loading: roomLoading, error: roomError } = useRoom(roomId);
    const { userId, userName, saveName } = useUser();

    const [joinName, setJoinName] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState("");

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

    if (roomLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Room...</div>;
    if (roomError) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">{roomError}</div>;
    if (!room) return null;

    const isPlayer = !!room.players[userId];
    const playerCount = Object.keys(room.players).length;

    // Not signed in / Not joined yet
    if (!isPlayer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
                    <h1 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Join Room {roomId}</h1>
                    <p className="text-gray-400 text-center mb-6">Enter your name to play!</p>

                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
                            <input
                                type="text"
                                value={joinName}
                                onChange={(e) => setJoinName(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white outline-none"
                                placeholder="Nickname"
                            />
                        </div>
                        {joinError && <p className="text-red-400 text-sm center">{joinError}</p>}
                        <button
                            type="submit"
                            disabled={isJoining}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-lg font-bold text-white transition-all transform hover:scale-[1.02]"
                        >
                            {isJoining ? "Joining..." : "Join Game"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Signed in - Render Main Layout
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Room {roomId}</h1>
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300 font-mono">
                        {playerCount} / {room.config.maxPlayers} Players
                    </span>
                </div>
                <button onClick={copyLink} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md transition-colors">
                    🔗 Invite
                </button>
            </header>

            <main className="flex-1 p-2 md:p-6 flex flex-col items-center">
                {room.status === "playing" ? (
                    <GameView room={room} />
                ) : room.status === "finished" ? (
                    <GameOverView room={room} />
                ) : (
                    <LobbyView room={room} userId={userId} roomId={roomId} />
                )}
            </main>
        </div>
    );
}
