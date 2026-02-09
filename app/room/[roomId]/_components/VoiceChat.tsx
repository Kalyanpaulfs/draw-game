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

    // Mute state: Logical preference vs Physical track state
    const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
    const isMicMutedRef = useRef<boolean>(false);

    // Audio Context & Analyser refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null); // Animation frame reference
    const [volume, setVolume] = useState(0);

    // Sync ref with state for event listeners
    useEffect(() => {
        isMicMutedRef.current = isMicMuted;
    }, [isMicMuted]);

    // 1. Initialize Audio (First Run)
    const initializeAudio = useCallback(async () => {
        try {
            console.log("Initializing Audio...");
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

            if (AudioContext && !audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            // Get initial stream
            const newStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

            // Set up tracks
            handleNewStream(newStream);

        } catch (err) {
            console.error("Error initializing audio:", err);
        }
    }, []);

    // 2. Re-acquire Stream (Recovery)
    const reacquireStream = useCallback(async () => {
        try {
            console.log("Re-acquiring audio stream due to interruption/backgrounding...");

            // Cleanup old tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }

            // Constraints for recovery
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            };

            // Get new stream
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Handle critical track replacement for peers
            handleNewStream(newStream);

            // Update all existing peers with the new stream
            replaceTrackOnPeers(streamRef.current, newStream);

        } catch (err) {
            console.error("Error re-acquiring stream:", err);
        }
    }, []);

    // Helper: Handle new stream setup (local)
    const handleNewStream = (newStream: MediaStream) => {
        setStream(newStream);
        streamRef.current = newStream;

        // Apply mute preference immediately
        const audioTrack = newStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !isMicMutedRef.current;

            // Add listeners for OS-level muting (Phone calls)
            audioTrack.onmute = () => {
                console.warn("Track muted by OS (Incoming call?)");
                // We don't change React state here strictly, but we know the track is dead temporarily
            };
            audioTrack.onunmute = () => {
                console.log("Track unmuted by OS. Verifying state...");
                // Force sync 
                audioTrack.enabled = !isMicMutedRef.current;
            };
            audioTrack.onended = () => {
                console.warn("Track ended unexpectedly. Attempting recovery...");
                reacquireStream();
            };
        }

        // Setup Analyser
        setupAnalyser(newStream);
    };

    // Helper: Setup AudioContext Analyser
    const setupAnalyser = (currentStream: MediaStream) => {
        if (!audioContextRef.current) return;

        try {
            const ctx = audioContextRef.current;
            // Ensure running
            if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
                ctx.resume().catch(e => console.warn("Auto-resume failed:", e));
            }

            // Cleanup old source
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = ctx.createMediaStreamSource(currentStream);
            source.connect(analyser);
            sourceRef.current = source;

            // Start visualization loop if not running
            if (!rafRef.current) {
                measureVolume();
            }

        } catch (err) {
            console.error("Error setting up analyser:", err);
        }
    };

    const measureVolume = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            setVolume(Math.min(100, average * 2.5));

            rafRef.current = requestAnimationFrame(update);
        };
        update();
    };

    // CRITICAL: Replace Track on Peers
    const replaceTrackOnPeers = (oldStream: MediaStream | null, newStream: MediaStream) => {
        const newTrack = newStream.getAudioTracks()[0];
        const oldTrack = oldStream?.getAudioTracks()[0];

        if (!newTrack) return;

        console.log("Replacing tracks for", Object.keys(peersRef.current).length, "peers");

        Object.values(peersRef.current).forEach(({ peer }) => {
            if (!peer || peer.destroyed) return;

            try {
                // simple-peer / WebRTC `replaceTrack`
                // signature: replaceTrack(oldTrack, newTrack, stream)
                if (oldTrack) {
                    peer.replaceTrack(oldTrack, newTrack, newStream);
                } else {
                    // Fallback if no old track, just add it (uncommon in this flow)
                    peer.addTrack(newTrack, newStream);
                }
            } catch (e) {
                console.error("Peer replaceTrack failed:", e);
            }
        });
    };

    // Mute Logic (Enforcer)
    useEffect(() => {
        if (streamRef.current) {
            const track = streamRef.current.getAudioTracks()[0];
            if (track) {
                // Always enforce user preference
                track.enabled = !isMicMuted;
            }
        }
    }, [isMicMuted, stream]); // Run when Stream changes OR Mute changes

    const toggleMute = () => {
        if (hasMoved.current) return;
        setIsMicMuted(prev => !prev);
    };

    // Setup on mount
    useEffect(() => {
        initializeAudio();

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [initializeAudio]);


    // LIFECYCLE: Visibility & Interruption Handling
    useEffect(() => {
        const handleVisibilityChange = async () => {
            console.log("Visibility Change:", document.visibilityState);

            if (document.visibilityState === 'visible') {
                // 1. Check AudioContext
                if (audioContextRef.current) {
                    const state = audioContextRef.current.state;
                    console.log("AudioContext State on visible:", state);

                    if (state === 'suspended' || state === 'interrupted') {
                        try {
                            await audioContextRef.current.resume();
                        } catch (e) {
                            console.warn("Resume failed on visibility change, waiting for interaction", e);
                        }
                    }
                }

                // 2. Check Stream Healthy
                if (streamRef.current) {
                    const track = streamRef.current.getAudioTracks()[0];
                    if (!track) {
                        await reacquireStream();
                    } else if (track.readyState === 'ended') {
                        console.warn("Track dead on return. Re-acquiring.");
                        await reacquireStream();
                    } else if (track.muted) {
                        console.warn("Track still muted by OS on return.");
                        // Optional: Timeout to force re-acquire if it stays muted?
                        setTimeout(() => {
                            if (track.muted && document.visibilityState === 'visible') {
                                console.warn("Track stuck muted. Forcing re-acquisition.");
                                reacquireStream();
                            }
                        }, 2500);
                    }
                }

                // 3. Resume External Audio Elements
                document.querySelectorAll('audio').forEach(audio => {
                    if (audio.paused && audio.srcObject) {
                        audio.play().catch(e => console.log("Auto-resume audio element failed:", e));
                    }
                });
            }
        };

        const handleInteraction = async () => {
            // Always try to resume context on touch/click
            if (audioContextRef.current && (audioContextRef.current.state === 'suspended' || audioContextRef.current.state === 'interrupted')) {
                console.log("Restoring AudioContext on user interaction");
                try {
                    await audioContextRef.current.resume();
                } catch (e) { console.error(e); }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('click', handleInteraction);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
    }, [reacquireStream]);


    // -- EXISTING PEER & DRAG LOGIC BELOW (Unchanged mostly, just ensure refs usage) --

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
                },
                // SDP Transform to limit Bitrate (Bandwidth Optimization)
                sdpTransform: (sdp: string) => {
                    // Limit OPUS bitrate to 32kbps (good quality, low latency)
                    return sdp.replace("a=fmtp:111 minptime=10;useinbandfec=1", "a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=32000");
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
    }, [roomId, userId]); // Removed stream from dependency to avoid recreation loops

    // WebRTC: Signaling & Peers
    useEffect(() => {
        if (!userId || !roomId) return; // Wait for setup

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
                            createPeer(senderId, false, signal);
                        } else {
                            peersRef.current[senderId].peer.signal(signal);
                        }
                    } else {
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
    }, [userId, roomId, players, createPeer]); // stream removed from deps to prevent re-negotiation storm

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
                const newX = clientX - dragOffset.current.x;
                const newY = clientY - dragOffset.current.y;

                const clampedX = Math.max(0, Math.min(window.innerWidth - 60, newX));
                const clampedY = Math.max(0, Math.min(window.innerHeight - 60, newY));

                setPosition({
                    x: clampedX,
                    y: clampedY
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
                        : isMicMuted
                            ? 'bg-red-500/80 text-white hover:bg-red-600'
                            : 'bg-slate-900/80 text-emerald-400 hover:bg-slate-800 backdrop-blur-md'
                        }`}
                >
                    {/* Volume Meter Ring */}
                    {!isMicMuted && stream && (
                        <div
                            className="absolute inset-0 rounded-full border-2 border-emerald-500/50 pointer-events-none transition-all duration-75 ease-out"
                            style={{
                                transform: `scale(${1 + (volume / 100) * 0.4})`,
                                opacity: Math.max(0.1, volume / 100)
                            }}
                        />
                    )}
                    {isMicMuted ? (
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
