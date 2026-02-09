/**
 * Voice Module Types
 * 
 * Core type definitions for the voice chat system.
 * Follows the architecture design from Phase 1.
 */

// ============================================================================
// State Types
// ============================================================================

export type AudioStatus =
    | 'idle'        // No mic access, no active stream
    | 'requesting'  // getUserMedia in progress
    | 'ready'       // Active stream, track is live
    | 'suspended'   // Track exists but is dead/ended
    | 'error';      // Permission denied or hardware failure

export interface AudioManagerState {
    status: AudioStatus;
    stream: MediaStream | null;
    track: MediaStreamTrack | null;
    isMuted: boolean;
    error: Error | null;
    lastRecoveryAttempt: number;
    recoveryAttempts: number;
}

// ============================================================================
// Event Types
// ============================================================================

export type AudioEvent =
    | 'stateChange'
    | 'trackReady'
    | 'trackEnded'
    | 'muted'
    | 'unmuted'
    | 'error'
    | 'recoveryStart'
    | 'recoverySuccess'
    | 'recoveryFailed';

export type AudioEventHandler = (data?: unknown) => void;

// ============================================================================
// Audio Constraints
// ============================================================================

/**
 * Optimized audio constraints for voice chat.
 * Prioritizes low latency while keeping essential processing.
 */
export const VOICE_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
    // Essential processing - keep enabled
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,

    // Latency optimization
    // @ts-expect-error - latency is valid but not in TS types
    latency: 0,

    // Opus-optimized sample rate
    sampleRate: 48000,

    // Mono for voice (saves bandwidth)
    channelCount: 1,
};

// ============================================================================
// Configuration Constants
// ============================================================================

export const AUDIO_CONFIG = {
    // Recovery settings
    MIN_RECOVERY_INTERVAL_MS: 300,
    MAX_RECOVERY_ATTEMPTS: 3,
    RECOVERY_BACKOFF_MULTIPLIER: 2,

    // Health check settings
    HEALTH_CHECK_INTERVAL_MS: 5000,

    // Debounce settings
    VISIBILITY_DEBOUNCE_MS: 300,
} as const;
