/**
 * AudioManager - Singleton Microphone Manager
 * 
 * THE ONLY entity that may call getUserMedia().
 * Owns the microphone stream and track lifecycle.
 * Provides mute/unmute without killing the stream.
 * Handles automatic recovery from OS interruptions.
 * 
 * DESIGN PRINCIPLES:
 * 1. Single ownership - only AudioManager touches getUserMedia
 * 2. Tracks are disposable - they will die, plan for recovery
 * 3. Mute ≠ Stop - use track.enabled, keep stream alive
 * 4. Fail fast, recover faster - detect issues early
 */

import {
    AudioManagerState,
    AudioStatus,
    AudioEvent,
    AudioEventHandler,
    VOICE_AUDIO_CONSTRAINTS,
    AUDIO_CONFIG,
} from './types';

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: AudioManager | null = null;

// ============================================================================
// AudioManager Class
// ============================================================================

class AudioManager {
    // ---------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------

    private state: AudioManagerState = {
        status: 'idle',
        stream: null,
        track: null,
        isMuted: false,
        error: null,
        lastRecoveryAttempt: 0,
        recoveryAttempts: 0,
    };

    // Event listeners
    private listeners: Map<AudioEvent, Set<AudioEventHandler>> = new Map();

    // Bound handlers for cleanup
    private boundHandlers = {
        onTrackEnded: this.handleTrackEnded.bind(this),
        onVisibilityChange: this.handleVisibilityChange.bind(this),
    };

    // ---------------------------------------------------------------------------
    // Constructor (private - use getInstance())
    // ---------------------------------------------------------------------------

    private constructor() {
        // Set up visibility change listener for mobile recovery
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.boundHandlers.onVisibilityChange);
        }
    }

    // ---------------------------------------------------------------------------
    // Singleton Access
    // ---------------------------------------------------------------------------

    /**
     * Get the singleton AudioManager instance.
     * Creates it if it doesn't exist.
     */
    static getInstance(): AudioManager {
        if (!instance) {
            instance = new AudioManager();
        }
        return instance;
    }

    /**
     * Destroy the singleton instance.
     * Should only be used for cleanup on app unmount.
     */
    static destroyInstance(): void {
        if (instance) {
            instance.dispose();
            instance = null;
        }
    }

    // ---------------------------------------------------------------------------
    // Lifecycle: Mic Request
    // ---------------------------------------------------------------------------

    /**
     * Request microphone access and initialize the audio track.
     * 
     * ONLY AudioManager may call getUserMedia.
     * 
     * @returns The audio track, or null if failed
     */
    async requestMic(): Promise<MediaStreamTrack | null> {
        // Already have a healthy track? Return it.
        if (this.state.status === 'ready' && this.isTrackHealthy()) {
            return this.state.track;
        }

        // Already requesting? Wait for it.
        if (this.state.status === 'requesting') {
            // Return null to indicate request in progress
            // Caller should wait for 'trackReady' event
            return null;
        }

        this.setState({ status: 'requesting', error: null });

        try {
            // THE ONLY getUserMedia call in the entire app
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: VOICE_AUDIO_CONSTRAINTS,
                video: false,
            });

            const tracks = stream.getAudioTracks();
            if (tracks.length === 0) {
                throw new Error('No audio track received from getUserMedia');
            }

            const track = tracks[0];

            // Attach ended listener for recovery
            track.addEventListener('ended', this.boundHandlers.onTrackEnded);

            // Store references
            this.setState({
                status: 'ready',
                stream,
                track,
                recoveryAttempts: 0, // Reset on successful acquisition
            });

            this.emit('trackReady', track);

            return track;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));

            this.setState({
                status: 'error',
                error: err,
            });

            this.emit('error', err);

            return null;
        }
    }

    // ---------------------------------------------------------------------------
    // Lifecycle: Disposal
    // ---------------------------------------------------------------------------

    /**
     * Stop the track and release all resources.
     * Call this when leaving voice chat entirely.
     */
    dispose(): void {
        // Clean up track
        if (this.state.track) {
            this.state.track.removeEventListener('ended', this.boundHandlers.onTrackEnded);
            this.state.track.stop();
        }

        // Clean up stream
        if (this.state.stream) {
            this.state.stream.getTracks().forEach(t => t.stop());
        }

        // Remove visibility listener
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.boundHandlers.onVisibilityChange);
        }

        // Reset state
        this.setState({
            status: 'idle',
            stream: null,
            track: null,
            isMuted: false,
            error: null,
            lastRecoveryAttempt: 0,
            recoveryAttempts: 0,
        });

        // Clear all listeners
        this.listeners.clear();
    }

    // ---------------------------------------------------------------------------
    // Mute Control
    // ---------------------------------------------------------------------------

    /**
     * Mute the microphone.
     * 
     * IMPORTANT: Uses track.enabled = false, NOT track.stop().
     * This keeps the stream alive for instant unmute and no renegotiation.
     */
    mute(): void {
        if (this.state.track && this.state.status === 'ready') {
            this.state.track.enabled = false;
            this.setState({ isMuted: true });
            this.emit('muted');
        }
    }

    /**
     * Unmute the microphone.
     * Instant - no permission prompt or renegotiation needed.
     */
    unmute(): void {
        if (this.state.track && this.state.status === 'ready') {
            this.state.track.enabled = true;
            this.setState({ isMuted: false });
            this.emit('unmuted');
        }
    }

    /**
     * Toggle mute state.
     */
    toggleMute(): void {
        if (this.state.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
    }

    // ---------------------------------------------------------------------------
    // State Accessors
    // ---------------------------------------------------------------------------

    /**
     * Get the current AudioManager state.
     */
    getState(): Readonly<AudioManagerState> {
        return { ...this.state };
    }

    /**
     * Get the current audio track (for WebRTC).
     */
    getTrack(): MediaStreamTrack | null {
        return this.state.track;
    }

    /**
     * Get the current MediaStream.
     */
    getStream(): MediaStream | null {
        return this.state.stream;
    }

    /**
     * Check if currently muted.
     */
    isMuted(): boolean {
        return this.state.isMuted;
    }

    /**
     * Check if ready to transmit audio.
     */
    isReady(): boolean {
        return this.state.status === 'ready' && this.isTrackHealthy();
    }

    // ---------------------------------------------------------------------------
    // Track Health
    // ---------------------------------------------------------------------------

    /**
     * Check if the current track is healthy and usable.
     */
    isTrackHealthy(): boolean {
        const { track, isMuted } = this.state;

        if (!track) return false;
        if (track.readyState === 'ended') return false;

        // If track is muted but user didn't mute it, OS probably muted it
        if (track.muted && !isMuted) return false;

        return true;
    }

    /**
     * Perform a health check and trigger recovery if needed.
     * @returns true if healthy, false if recovery was triggered
     */
    checkHealth(): boolean {
        if (this.state.status !== 'ready') {
            return this.state.status === 'idle';
        }

        if (!this.isTrackHealthy()) {
            this.handleTrackEnded();
            return false;
        }

        return true;
    }

    // ---------------------------------------------------------------------------
    // Recovery
    // ---------------------------------------------------------------------------

    /**
     * Attempt to recover from a dead track.
     * Called automatically on track ended or visibility change.
     * 
     * @returns true if recovery successful, false otherwise
     */
    async attemptRecovery(): Promise<boolean> {
        const now = Date.now();
        const timeSinceLastAttempt = now - this.state.lastRecoveryAttempt;

        // Debounce rapid recovery attempts
        const minInterval = AUDIO_CONFIG.MIN_RECOVERY_INTERVAL_MS *
            Math.pow(AUDIO_CONFIG.RECOVERY_BACKOFF_MULTIPLIER, this.state.recoveryAttempts);

        if (timeSinceLastAttempt < minInterval) {
            return false;
        }

        // Max attempts check
        if (this.state.recoveryAttempts >= AUDIO_CONFIG.MAX_RECOVERY_ATTEMPTS) {
            this.emit('recoveryFailed');
            return false;
        }

        this.setState({
            lastRecoveryAttempt: now,
            recoveryAttempts: this.state.recoveryAttempts + 1,
        });

        this.emit('recoveryStart');

        // Clean up dead track first
        const wasMuted = this.state.isMuted;
        this.cleanupDeadTrack();

        // Request new mic
        const track = await this.requestMic();

        if (track) {
            // Preserve mute state
            if (wasMuted) {
                this.mute();
            }
            this.emit('recoverySuccess', track);
            return true;
        }

        return false;
    }

    // ---------------------------------------------------------------------------
    // Event Handlers (Private)
    // ---------------------------------------------------------------------------

    /**
     * Handle track ended event.
     * Transitions to suspended state and triggers recovery.
     */
    private handleTrackEnded(): void {
        if (this.state.status === 'idle') return;

        this.setState({ status: 'suspended' });
        this.emit('trackEnded');

        // Attempt automatic recovery
        this.attemptRecovery();
    }

    /**
     * Handle visibility change.
     * On mobile, tracks often die when app is backgrounded.
     */
    private handleVisibilityChange(): void {
        if (document.visibilityState === 'visible') {
            // Debounce the health check
            setTimeout(() => {
                if (this.state.status === 'ready' || this.state.status === 'suspended') {
                    this.checkHealth();
                }
            }, AUDIO_CONFIG.VISIBILITY_DEBOUNCE_MS);
        }
    }

    // ---------------------------------------------------------------------------
    // Helper Methods (Private)
    // ---------------------------------------------------------------------------

    /**
     * Update state and emit stateChange event.
     */
    private setState(updates: Partial<AudioManagerState>): void {
        const oldStatus = this.state.status;
        this.state = { ...this.state, ...updates };

        if (updates.status && updates.status !== oldStatus) {
            this.emit('stateChange', { from: oldStatus, to: updates.status });
        }
    }

    /**
     * Clean up a dead track without full disposal.
     */
    private cleanupDeadTrack(): void {
        if (this.state.track) {
            this.state.track.removeEventListener('ended', this.boundHandlers.onTrackEnded);
            try {
                this.state.track.stop();
            } catch {
                // Track may already be stopped
            }
        }

        if (this.state.stream) {
            this.state.stream.getTracks().forEach(t => {
                try { t.stop(); } catch { /* ignore */ }
            });
        }

        this.state.stream = null;
        this.state.track = null;
    }

    // ---------------------------------------------------------------------------
    // Event Emitter
    // ---------------------------------------------------------------------------

    /**
     * Subscribe to an event.
     */
    on(event: AudioEvent, handler: AudioEventHandler): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
    }

    /**
     * Unsubscribe from an event.
     */
    off(event: AudioEvent, handler: AudioEventHandler): void {
        this.listeners.get(event)?.delete(handler);
    }

    /**
     * Emit an event to all subscribers.
     */
    private emit(event: AudioEvent, data?: unknown): void {
        this.listeners.get(event)?.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`[AudioManager] Error in ${event} handler:`, error);
            }
        });
    }
}

// ============================================================================
// Export
// ============================================================================

export { AudioManager };

/**
 * Get the AudioManager singleton.
 * Convenience function for common usage.
 */
export function getAudioManager(): AudioManager {
    return AudioManager.getInstance();
}
