/**
 * VoiceContext - React Context for Voice Chat
 * 
 * Provides voice chat state and controls to the entire app.
 * Integrates AudioManager, PeerManager, VoiceSignaling, and RecoveryManager.
 * 
 * This is the main integration point for the voice system.
 */

'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    ReactNode,
} from 'react';
import { getAudioManager, AudioManager } from '@/lib/voice/AudioManager';
import { PeerManager } from '@/lib/voice/PeerManager';
import { VoiceSignaling } from '@/lib/voice/VoiceSignaling';
import { getRecoveryManager, RecoveryManager } from '@/lib/voice/RecoveryManager';
import { SignalingMessage } from '@/lib/voice/webrtc-config';

// ============================================================================
// Types
// ============================================================================

export type VoiceStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface VoiceContextState {
    // Connection state
    status: VoiceStatus;
    isConnected: boolean;
    isReconnecting: boolean;

    // Audio state
    isMuted: boolean;
    isReady: boolean;

    // Network state
    isNetworkOnline: boolean;

    // Remote peers
    connectedPeers: string[];
    remoteStreams: Map<string, MediaStream>;

    // Peer manager (for DataChannel access)
    peerManager: PeerManager | null;

    // Error
    error: Error | null;
}

interface VoiceContextActions {
    // Join/Leave
    joinVoice: () => Promise<void>;
    leaveVoice: () => void;

    // Mute controls
    mute: () => void;
    unmute: () => void;
    toggleMute: () => void;

    // Recovery
    forceReconnect: () => Promise<void>;
}

interface VoiceContextValue extends VoiceContextState, VoiceContextActions { }

// ============================================================================
// Context
// ============================================================================

const VoiceContext = createContext<VoiceContextValue | null>(null);

// ============================================================================
// Provider Props
// ============================================================================

interface VoiceProviderProps {
    children: ReactNode;
    roomId: string;
    userId: string;
    peerIds: string[]; // List of other users in the room
}

// ============================================================================
// Provider Component
// ============================================================================

export function VoiceProvider({
    children,
    roomId,
    userId,
    peerIds,
}: VoiceProviderProps) {
    // Refs for managers (stable across renders)
    const audioManagerRef = useRef<AudioManager | null>(null);
    const peerManagerRef = useRef<PeerManager | null>(null);
    const signalingRef = useRef<VoiceSignaling | null>(null);
    const recoveryManagerRef = useRef<RecoveryManager | null>(null);

    // State
    const [status, setStatus] = useState<VoiceStatus>('disconnected');
    const [isMuted, setIsMuted] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isNetworkOnline, setIsNetworkOnline] = useState(true);
    const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [error, setError] = useState<Error | null>(null);
    const [peerManagerState, setPeerManagerState] = useState<PeerManager | null>(null);

    // ---------------------------------------------------------------------------
    // Initialize Audio & Recovery Managers
    // ---------------------------------------------------------------------------

    useEffect(() => {
        audioManagerRef.current = getAudioManager();
        recoveryManagerRef.current = getRecoveryManager();

        const am = audioManagerRef.current;
        am.on('stateChange', () => {
            const state = am.getState();
            setIsReady(state.status === 'ready');
            if (state.status === 'error') {
                setError(state.error);
                setStatus('error');
            }
        });
        am.on('muted', () => setIsMuted(true));
        am.on('unmuted', () => setIsMuted(false));

        const rm = recoveryManagerRef.current;
        rm.on('recoveryStarted', () => setStatus('reconnecting'));
        rm.on('recoveryCompleted', () => setStatus('connected'));
        rm.on('recoveryFailed', () => setStatus('error'));
        rm.on('networkChanged', (data) => {
            const { online } = data as { online: boolean };
            setIsNetworkOnline(online);
        });

        return () => { };
    }, []);

    // ---------------------------------------------------------------------------
    // Signaling & Stream Callbacks
    // ---------------------------------------------------------------------------

    const handleSignalingMessage = useCallback((message: SignalingMessage) => {
        const pm = peerManagerRef.current;
        if (!pm) return;
        switch (message.type) {
            case 'offer':
                pm.handleOffer(message.from, message.sdp);
                break;
            case 'answer':
                pm.handleAnswer(message.from, message.sdp);
                break;
            case 'ice-candidate':
                pm.handleIceCandidate(message.from, message.candidate);
                break;
        }
    }, []);

    const handleRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
        setRemoteStreams(prev => {
            const next = new Map(prev);
            next.set(peerId, stream);
            return next;
        });
        setConnectedPeers(prev => {
            if (!prev.includes(peerId)) return [...prev, peerId];
            return prev;
        });
    }, []);

    const handleRemoteStreamRemoved = useCallback((peerId: string) => {
        setRemoteStreams(prev => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
        });
        setConnectedPeers(prev => prev.filter(id => id !== peerId));
    }, []);

    // ---------------------------------------------------------------------------
    // Auto-initialize PeerManager & Signaling for DataChannels
    // This runs on mount so drawing DataChannels work without voice join.
    // ---------------------------------------------------------------------------

    // Effect 1: Create PeerManager + Signaling (lifecycle)
    useEffect(() => {
        // Initialize signaling
        const signaling = new VoiceSignaling({
            roomId,
            localUserId: userId,
            onMessage: handleSignalingMessage,
        });
        signaling.start();
        signalingRef.current = signaling;

        // Initialize PeerManager (without audio — just for DataChannels)
        const pm = new PeerManager({
            localUserId: userId,
            onSignalingMessage: async (msg) => {
                await signalingRef.current?.send(msg);
            },
            onRemoteStream: handleRemoteStream,
            onRemoteStreamRemoved: handleRemoteStreamRemoved,
        });
        peerManagerRef.current = pm;
        setPeerManagerState(pm);

        // Add event listeners for connection monitoring
        pm.on('connectionStateChange', (data) => {
            const { peerId, state } = data as { peerId: string, state: string };
            console.log(`[VoiceContext] Connection state for ${peerId}: ${state}`);
        });

        pm.on('peerFailed', (data) => {
            const { peerId } = data as { peerId: string };
            console.warn(`[VoiceContext] Peer connection failed: ${peerId}`);
            // Could notify user via toast here
        });

        console.log('[VoiceProvider] Auto-initialized PeerManager for DataChannels');

        return () => {
            console.log('[VoiceProvider] Cleaning up PeerManager and signaling');
            signaling.stop();
            signalingRef.current = null;
            pm.dispose();
            peerManagerRef.current = null;
            setPeerManagerState(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, userId]);

    // Effect 2: Sync peers whenever peerIds changes
    useEffect(() => {
        const pm = peerManagerRef.current;
        if (!pm) return;

        const existingPeerIds = Array.from(pm.getAllPeers().keys());

        // Add new peers
        for (const peerId of peerIds) {
            if (peerId !== userId && !existingPeerIds.includes(peerId)) {
                const isInitiator = userId < peerId;
                pm.createPeer(peerId, isInitiator);
                console.log(`[VoiceProvider] Created peer ${peerId} (initiator=${isInitiator})`);
            }
        }

        // Remove peers that left
        for (const peerId of existingPeerIds) {
            if (!peerIds.includes(peerId)) {
                pm.removePeer(peerId);
            }
        }
    }, [peerIds, userId]);

    // ---------------------------------------------------------------------------
    // Join Voice (adds audio to existing peer connections)
    // ---------------------------------------------------------------------------

    const joinVoice = useCallback(async () => {
        if (status === 'connected' || status === 'connecting') return;

        setStatus('connecting');
        setError(null);

        try {
            // 1. Request microphone
            const am = getAudioManager();
            const track = await am.requestMic();

            if (!track) {
                throw new Error('Failed to get microphone access');
            }

            // 2. PeerManager already initialized — just add audio track to all peers
            const pm = peerManagerRef.current;
            if (pm) {
                // Ensure track is enabled and replace on all peers
                track.enabled = true;
                console.log('[VoiceProvider] Track enabled:', track.enabled, 'readyState:', track.readyState);

                // Small delay then confirm track on all peers
                setTimeout(() => {
                    const latestTrack = am.getTrack();
                    if (pm && latestTrack) {
                        pm.replaceTrackOnAllPeers(latestTrack);
                        console.log('[VoiceProvider] Kicked track on all peers');
                    }
                }, 500);
            }

            setStatus('connected');
            setIsReady(true);
            setIsMuted(false);

        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            setStatus('error');
            console.error('[VoiceProvider] Join failed:', error);
        }
    }, [status, roomId, userId, peerIds, handleSignalingMessage, handleRemoteStream, handleRemoteStreamRemoved]);

    // ---------------------------------------------------------------------------
    // Leave Voice
    // ---------------------------------------------------------------------------

    const leaveVoice = useCallback(() => {
        // Only stop audio — PeerManager and signaling stay alive for DataChannels
        audioManagerRef.current?.dispose();

        // Clear voice-specific state
        setStatus('disconnected');
        setIsReady(false);
        setIsMuted(false);
        setError(null);
    }, []);

    // ---------------------------------------------------------------------------
    // Mute Controls
    // ---------------------------------------------------------------------------

    const mute = useCallback(() => {
        audioManagerRef.current?.mute();
    }, []);

    const unmute = useCallback(() => {
        audioManagerRef.current?.unmute();
    }, []);

    const toggleMute = useCallback(() => {
        audioManagerRef.current?.toggleMute();
    }, []);

    // ---------------------------------------------------------------------------
    // Force Reconnect
    // ---------------------------------------------------------------------------

    const forceReconnect = useCallback(async () => {
        setStatus('reconnecting');

        const rm = recoveryManagerRef.current;
        if (rm) {
            const success = await rm.forceRecovery();

            if (success) {
                setStatus('connected');
            } else {
                setStatus('error');
                setError(new Error('Failed to reconnect'));
            }
        }
    }, []);

    // Handle Peer Changes is now integrated into the auto-init effect above
    // which runs whenever peerIds changes

    // ---------------------------------------------------------------------------
    // Context Value
    // ---------------------------------------------------------------------------

    const value: VoiceContextValue = {
        // State
        status,
        isConnected: status === 'connected',
        isReconnecting: status === 'reconnecting',
        isMuted,
        isReady,
        isNetworkOnline,
        connectedPeers,
        remoteStreams,
        peerManager: peerManagerState,
        error,

        // Actions
        joinVoice,
        leaveVoice,
        mute,
        unmute,
        toggleMute,
        forceReconnect,
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}

            {/* Render audio elements for remote streams */}
            <RemoteAudioRenderer streams={remoteStreams} />
        </VoiceContext.Provider>
    );
}

// ============================================================================
// Remote Audio Renderer
// ============================================================================

interface RemoteAudioRendererProps {
    streams: Map<string, MediaStream>;
}

function RemoteAudioRenderer({ streams }: RemoteAudioRendererProps) {
    return (
        <div style={{ display: 'none' }} aria-hidden="true">
            {Array.from(streams.entries()).map(([peerId, stream]) => (
                <RemoteAudio key={peerId} peerId={peerId} stream={stream} />
            ))}
        </div>
    );
}

interface RemoteAudioProps {
    peerId: string;
    stream: MediaStream;
}

function RemoteAudio({ peerId, stream }: RemoteAudioProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playFailed, setPlayFailed] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.srcObject = stream;

        // Try to play with retries
        const attemptPlay = async () => {
            try {
                await audio.play();
                setPlayFailed(false);
                console.log(`[RemoteAudio] Playing audio for ${peerId}`);
            } catch (err) {
                console.warn(`[RemoteAudio] Autoplay blocked for ${peerId}, waiting for user gesture`);
                setPlayFailed(true);

                // Add click handler to resume on user interaction
                const resumeOnClick = async () => {
                    try {
                        await audio.play();
                        setPlayFailed(false);
                        document.removeEventListener('click', resumeOnClick);
                        document.removeEventListener('touchstart', resumeOnClick);
                    } catch (e) {
                        console.error('[RemoteAudio] Click play also failed:', e);
                    }
                };

                document.addEventListener('click', resumeOnClick, { once: true });
                document.addEventListener('touchstart', resumeOnClick, { once: true });
            }
        };

        attemptPlay();

        return () => {
            audio.pause();
            audio.srcObject = null;
        };
    }, [stream, peerId]);

    return (
        <audio
            ref={audioRef}
            autoPlay
            playsInline
            data-peer-id={peerId}
        />
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useVoiceContext(): VoiceContextValue {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error('useVoiceContext must be used within a VoiceProvider');
    }
    return context;
}
