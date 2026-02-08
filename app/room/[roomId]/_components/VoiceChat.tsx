"use client";

import { useEffect, useRef, useState } from "react";
import { Room } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, doc, deleteDoc, query, where, getDocs, writeBatch } from "firebase/firestore";
// @ts-expect-error: No types for simple-peer
import SimplePeer from "simple-peer";

interface VoiceChatProps {
    roomId: string;
    userId: string;
    players: Room["players"];
}

interface PeerData {
    peer: SimplePeer.Instance;
    stream?: MediaStream;
}

export function VoiceChat({ roomId, userId, players }: VoiceChatProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Record<string, PeerData>>({});
    const peersRef = useRef<Record<string, PeerData>>({});
    const streamRef = useRef<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    // 1. Get User Media
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                streamRef.current = currentStream;
            })
            .catch((err) => {
                console.error("Failed to get microphone:", err);
            });

        return () => {
            // Cleanup stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // 2. Listen for Signals specific to ME
    useEffect(() => {
        if (!streamRef.current) return;

        const signalsRef = collection(db, "rooms", roomId, "signals", userId, "inbox");
        const unsubscribe = onSnapshot(signalsRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    const senderId = data.senderId;
                    const signal = JSON.parse(data.signal);

                    // If peer exists, just signal it
                    if (peersRef.current[senderId]) {
                        // Avoid signaling if destroyed
                        if (!peersRef.current[senderId].peer.destroyed) {
                            peersRef.current[senderId].peer.signal(signal);
                        }
                    } else {
                        // New incoming connection (I am the answerer)
                        // Verify determining rule: Only accept if I am > Sender?
                        // Actually, if I receive a signal, I must answer it regardless, 
                        // but strictly speaking, I should expect signals from `myId > senderId` (if they initiated).
                        // However, just responding to incoming offers is safer.

                        const peer = new SimplePeer({
                            initiator: false,
                            trickle: false,
                            stream: streamRef.current,
                        });

                        peer.on("signal", (signalData: any) => {
                            // Send answer back
                            sendSignal(roomId, senderId, userId, signalData);
                        });

                        peer.on("stream", (remoteStream: MediaStream) => {
                            setPeers((prev) => ({ ...prev, [senderId]: { peer, stream: remoteStream } }));
                            peersRef.current[senderId] = { peer, stream: remoteStream };
                        });

                        peer.on("close", () => {
                            removePeer(senderId);
                        });
                        peer.on("error", () => {
                            removePeer(senderId);
                        });

                        peersRef.current[senderId] = { peer }; // Stream comes later
                        setPeers((prev) => ({ ...prev, [senderId]: { peer } }));

                        peer.signal(signal);
                    }

                    // Delete the signal doc after processing so we don't re-process
                    deleteDoc(change.doc.ref);
                }
            });
        });

        return () => {
            unsubscribe();
        };
    }, [stream, roomId, userId]);

    // 3. Manage Outgoing Connections based on Room Players
    useEffect(() => {
        if (!stream) return;

        Object.keys(players).forEach((otherId) => {
            if (otherId === userId) return;

            // If we are strictly "initiator" based on ID sort
            if (userId < otherId) {
                // Check if peer already exists
                if (!peersRef.current[otherId]) {
                    // Create initiator peer
                    console.log(`Initiating connection to ${otherId}`);
                    const peer = new SimplePeer({
                        initiator: true,
                        trickle: false,
                        stream: stream,
                    });

                    peer.on("signal", (signalData: any) => {
                        sendSignal(roomId, otherId, userId, signalData);
                    });

                    peer.on("stream", (remoteStream: MediaStream) => {
                        setPeers((prev) => ({ ...prev, [otherId]: { peer, stream: remoteStream } }));
                        peersRef.current[otherId] = { peer, stream: remoteStream };
                    });

                    peer.on("close", () => {
                        removePeer(otherId);
                    });
                    peer.on("error", () => {
                        removePeer(otherId);
                    });

                    peersRef.current[otherId] = { peer };
                    setPeers((prev) => ({ ...prev, [otherId]: { peer } }));
                }
            }
        });

        // Cleanup peers that left the room
        Object.keys(peersRef.current).forEach((peerId) => {
            if (!players[peerId]) {
                removePeer(peerId);
            }
        });

    }, [players, stream, roomId, userId]);

    const removePeer = (id: string) => {
        if (peersRef.current[id]) {
            peersRef.current[id].peer.destroy();
            delete peersRef.current[id];
            setPeers((prev) => {
                const newPeers = { ...prev };
                delete newPeers[id];
                return newPeers;
            });
        }
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!stream.getAudioTracks()[0].enabled);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {/* Audio Elements (Hidden) */}
            {Object.entries(peers).map(([id, data]) => (
                data.stream && (
                    <audio
                        key={id}
                        ref={(ref) => { if (ref) ref.srcObject = data.stream!; }}
                        autoPlay
                        playsInline
                    />
                )
            ))}

            <div className="bg-slate-900/90 backdrop-blur border border-white/10 p-3 rounded-2xl shadow-2xl pointer-events-auto flex items-center gap-3">
                <button
                    onClick={() => {
                        if (stream) {
                            const newValue = !stream.getAudioTracks()[0].enabled;
                            stream.getAudioTracks()[0].enabled = newValue;
                            setIsMuted(!newValue);
                        }
                    }}
                    className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                >
                    {isMuted ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    )}
                </button>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Voice Chat</span>
                    <span className="text-xs font-medium text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${Object.keys(peers).length > 0 ? 'bg-emerald-500 animate-pulse' : (stream ? 'bg-amber-500' : 'bg-slate-500')}`}></span>
                        {Object.keys(peers).length > 0
                            ? `${Object.keys(peers).length} Peer${Object.keys(peers).length === 1 ? '' : 's'}`
                            : (stream ? "Listening..." : "Connecting...")}
                    </span>
                </div>
            </div>
        </div>
    );
}

async function sendSignal(roomId: string, recipientId: string, senderId: string, signalData: any) {
    const coll = collection(db, "rooms", roomId, "signals", recipientId, "inbox");
    await addDoc(coll, {
        senderId,
        signal: JSON.stringify(signalData),
        timestamp: Date.now()
    });
}
