/**
 * useVoice - React Hook for Voice Chat
 * 
 * Provides React components with access to AudioManager state.
 * Handles subscription lifecycle automatically.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getAudioManager,
    AudioManager,
    AudioManagerState,
    AudioEvent,
} from '@/lib/voice';

interface UseVoiceReturn {
    // State
    status: AudioManagerState['status'];
    isMuted: boolean;
    isReady: boolean;
    error: Error | null;

    // Actions
    requestMic: () => Promise<MediaStreamTrack | null>;
    mute: () => void;
    unmute: () => void;
    toggleMute: () => void;
    dispose: () => void;

    // Track access (for WebRTC integration)
    getTrack: () => MediaStreamTrack | null;
}

/**
 * React hook for voice chat functionality.
 * 
 * Usage:
 * ```tsx
 * const { status, isMuted, requestMic, toggleMute } = useVoice();
 * 
 * // Request mic on join
 * await requestMic();
 * 
 * // Toggle mute
 * toggleMute();
 * ```
 */
export function useVoice(): UseVoiceReturn {
    const managerRef = useRef<AudioManager | null>(null);

    // Local state derived from AudioManager
    const [state, setState] = useState<Pick<AudioManagerState, 'status' | 'isMuted' | 'error'>>({
        status: 'idle',
        isMuted: false,
        error: null,
    });

    // Initialize manager reference
    useEffect(() => {
        managerRef.current = getAudioManager();

        // Sync initial state
        const initialState = managerRef.current.getState();
        setState({
            status: initialState.status,
            isMuted: initialState.isMuted,
            error: initialState.error,
        });

        // Subscribe to state changes
        const handleStateChange = () => {
            if (managerRef.current) {
                const newState = managerRef.current.getState();
                setState({
                    status: newState.status,
                    isMuted: newState.isMuted,
                    error: newState.error,
                });
            }
        };

        const events: AudioEvent[] = [
            'stateChange',
            'muted',
            'unmuted',
            'error',
            'trackReady',
            'trackEnded',
            'recoverySuccess',
            'recoveryFailed',
        ];

        events.forEach(event => {
            managerRef.current?.on(event, handleStateChange);
        });

        // Cleanup subscriptions (but NOT the manager itself)
        return () => {
            events.forEach(event => {
                managerRef.current?.off(event, handleStateChange);
            });
        };
    }, []);

    // Actions
    const requestMic = useCallback(async () => {
        return managerRef.current?.requestMic() ?? null;
    }, []);

    const mute = useCallback(() => {
        managerRef.current?.mute();
    }, []);

    const unmute = useCallback(() => {
        managerRef.current?.unmute();
    }, []);

    const toggleMute = useCallback(() => {
        managerRef.current?.toggleMute();
    }, []);

    const dispose = useCallback(() => {
        managerRef.current?.dispose();
    }, []);

    const getTrack = useCallback(() => {
        return managerRef.current?.getTrack() ?? null;
    }, []);

    return {
        status: state.status,
        isMuted: state.isMuted,
        isReady: state.status === 'ready',
        error: state.error,
        requestMic,
        mute,
        unmute,
        toggleMute,
        dispose,
        getTrack,
    };
}
