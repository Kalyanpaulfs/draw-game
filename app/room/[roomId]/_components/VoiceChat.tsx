"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Room } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, doc, deleteDoc, query, where, getDocs, writeBatch } from "firebase/firestore";
// @ts-expect-error: No types for simple-peer
import SimplePeer from "simple-peer";

// Polyfill for simple-peer in browser environment (fixes Buffer/process errors)
if (typeof window !== 'undefined') {
    if ((window as any).global === undefined) (window as any).global = window;
    if ((window as any).process === undefined) (window as any).process = { env: {} };
}

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

    // Audio Context & Analyser refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null); // Animation frame reference
    const [volume, setVolume] = useState(0);

    // Audio Initialization & Volume Meter
    useEffect(() => {
        let mounted = true;

        // Initialize AudioContext
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext && !audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }

        const handleStreamConfig = (stream: MediaStream) => {
            if (!mounted) return;
            setStream(stream);
            streamRef.current = stream;

            // Setup Analyser if context exists
            if (audioContextRef.current) {
                try {
                    const ctx = audioContextRef.current;
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    analyserRef.current = analyser;

                    const source = ctx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    sourceRef.current = source;

                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    const updateVolume = () => {
                        if (!mounted || !analyserRef.current) return;
                        analyserRef.current.getByteFrequencyData(dataArray);

                        let sum = 0;
                        // Focus on voice frequency range roughly (lower bins)
                        for (let i = 0; i < bufferLength; i++) {
                            sum += dataArray[i];
                        }
                        const average = sum / bufferLength;
                        // Amplify for better visual feedback
                        setVolume(Math.min(100, average * 2.5));

                        rafRef.current = requestAnimationFrame(updateVolume);
                    };
                    updateVolume();
                } catch (err) {
                    console.error("Error setting up audio analyser:", err);
                }
            }
        };

        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then(handleStreamConfig)
            .catch((err) => {
                console.error("Error accessing microphone:", err);
            });

        return () => {
            mounted = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (sourceRef.current) {
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error);
                audioContextRef.current = null;
            }
        };
    }, []);

    // Resume Audio on Visibility Change & Interaction
    useEffect(() => {
        const resumeAudio = async () => {
            // Always try to resume AudioContext if it exists, ignoring current state to be safe
            if (audioContextRef.current) {
                try {
                    await audioContextRef.current.resume();
                } catch (e) {
                    console.error("Error resuming AudioContext:", e);
                }
            }

            // Resume all peer audio elements that might have been paused
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                if (audio.paused && audio.srcObject) {
                    audio.play().catch(e => console.log("Failed to resume audio element:", e));
                }
            });

            // Ensure local tracks are enabled (if not muted by user)
            if (streamRef.current && !isMuted) {
                streamRef.current.getAudioTracks().forEach(track => {
                    if (!track.enabled) track.enabled = true;
                });
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                resumeAudio();
            }
        };

        // Add listeners to resume audio context (needed for mobile browsers)
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('touchstart', resumeAudio);
        window.addEventListener('click', resumeAudio);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('touchstart', resumeAudio);
            window.removeEventListener('click', resumeAudio);
        };
    }, [isMuted]);

    // Helper to create peer (memoized)
    const createPeer = useCallback((id: string, initiator: boolean, incomingSignal?: any) => {
        try {
            if (peersRef.current[id]) {
                if (incomingSignal) peersRef.current[id].peer.signal(incomingSignal);
                return;
            }

            const peer = new SimplePeer({
                initiator,
                trickle: false,
                stream: streamRef.current || undefined,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peer.on("signal", (sig: any) => {
                sendSignal(roomId, id, userId, sig);
            });

            peer.on("stream", (remoteStream: MediaStream) => {
                setPeers((prev) => ({
                    ...prev,
                    [id]: { peer: peer!, stream: remoteStream }
                }));
            });

            peer.on("error", (err: any) => console.error(`Peer Error ${id}:`, err));

            peer.on("close", () => {
                delete peersRef.current[id];
                setPeers(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            });

            if (incomingSignal) {
                peer.signal(incomingSignal);
            }

            peersRef.current[id] = { peer };
            setPeers((prev) => ({ ...prev, [id]: { peer } }));
        } catch (err: any) {
            console.error("Create Peer Error:", err);
        }
    }, [roomId, userId, stream]);

    // WebRTC: Signaling & Peers
    useEffect(() => {
        if (!stream || !userId || !roomId) return;

        // Listen for signals
        const q = query(
            collection(db, "rooms", roomId, "signals", userId, "inbox"),
            where("timestamp", ">", Date.now() - 10000)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    const senderId = data.senderId;
                    const signal = JSON.parse(data.signal);

                    // FIX: If we receive a new OFFER from an existing peer, it means they reloaded.
                    // We must destroy the old connection and accept the new one.
                    if (peersRef.current[senderId]) {
                        if (signal.type === "offer") {
                            console.log(`Received new offer from existing peer ${senderId}. Resetting connection.`);
                            if (peersRef.current[senderId].peer) {
                                peersRef.current[senderId].peer.destroy();
                            }
                            delete peersRef.current[senderId];
                            setPeers(prev => {
                                const next = { ...prev };
                                delete next[senderId];
                                return next;
                            });
                            // Create new peer as non-initiator to accept the offer
                            createPeer(senderId, false, signal);
                        } else {
                            // Normal signaling for existing connection (answer, candidate)
                            peersRef.current[senderId].peer.signal(signal);
                        }
                    } else {
                        // New connection
                        createPeer(senderId, false, signal);
                    }
                    deleteDoc(change.doc.ref);
                }
            });
        });

        // Trigger connections
        Object.values(players).forEach((player) => {
            if (player.id !== userId && !peersRef.current[player.id]) {
                if (userId > player.id) {
                    createPeer(player.id, true);
                }
            }
        });

        return () => unsubscribe();
    }, [stream, userId, roomId, players, createPeer]);

    // Draggable Logic
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);
    const dragStartPosition = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging.current) return;
            const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

            const dist = Math.sqrt(Math.pow(clientX - dragStartPosition.current.x, 2) + Math.pow(clientY - dragStartPosition.current.y, 2));

            if (dist > 5) {
                if (e.cancelable) e.preventDefault();
                hasMoved.current = true;
                setPosition({
                    x: clientX - dragOffset.current.x,
                    y: clientY - dragOffset.current.y
                });
            }
        };

        const handleEnd = () => {
            isDragging.current = false;
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, []);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        isDragging.current = true;
        hasMoved.current = false;
        dragStartPosition.current = { x: clientX, y: clientY };
        dragOffset.current = {
            x: clientX - position.x,
            y: clientY - position.y
        };
    };

    const toggleMute = () => {
        if (hasMoved.current) return;
        if (stream) {
            const track = stream.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        }
    };

    if (!stream) return (
        <div className="fixed top-24 left-4 z-50">
            <div className="w-12 h-12 rounded-full bg-slate-700 animate-pulse flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
        </div>
    );

    return (
        <div
            className="fixed z-[9999] cursor-move touch-none select-none"
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
        >
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

            <div className="relative group">
                <button
                    onClick={toggleMute}
                    disabled={!stream}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border border-white/10 transition-all transform active:scale-95 ${!stream
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                        : isMuted
                            ? 'bg-red-500/80 text-white hover:bg-red-600'
                            : 'bg-slate-900/80 text-emerald-400 hover:bg-slate-800 backdrop-blur-md'
                        }`}
                >
                    {/* Volume Meter Ring */}
                    {!isMuted && stream && (
                        <div
                            className="absolute inset-0 rounded-full border-2 border-emerald-500/50 pointer-events-none transition-all duration-75 ease-out"
                            style={{
                                transform: `scale(${1 + (volume / 100) * 0.4})`,
                                opacity: Math.max(0.1, volume / 100)
                            }}
                        />
                    )}
                    {isMuted ? (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    ) : (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    )}
                </button>

                {/* Status Indicator Badge */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${Object.keys(peers).length > 0 ? 'bg-emerald-500' : (stream ? 'bg-amber-500' : 'bg-slate-500')
                    }`}>
                    {Object.keys(peers).length > 0 ? Object.keys(peers).length : ''}
                </div>
            </div>
        </div>
    );
}

async function sendSignal(roomId: string, recipientId: string, senderId: string, signalData: any) {
    try {
        const coll = collection(db, "rooms", roomId, "signals", recipientId, "inbox");
        await addDoc(coll, {
            senderId,
            signal: JSON.stringify(signalData),
            timestamp: Date.now()
        });
    } catch (e: any) {
        console.error("Signal Send Error", e);
    }
}
