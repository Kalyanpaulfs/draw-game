/**
 * RecoveryManager - Mobile & OS Interruption Recovery
 * 
 * Handles automatic recovery from:
 * - App backgrounding → foregrounding
 * - Screen lock → unlock
 * - Phone calls / WhatsApp / video calls
 * - Browser tab hidden → visible
 * - Network changes
 * 
 * DESIGN PRINCIPLES:
 * 1. Detect dead tracks early using multiple signals
 * 2. Debounce recovery attempts to prevent spam
 * 3. Use exponential backoff on repeated failures
 * 4. Sync with PeerManager for seamless track replacement
 */

import { getAudioManager } from './AudioManager';
import { AUDIO_CONFIG } from './types';

// ============================================================================
// Types
// ============================================================================

export type RecoveryEvent =
    | 'recoveryNeeded'
    | 'recoveryStarted'
    | 'recoveryCompleted'
    | 'recoveryFailed'
    | 'networkChanged';

type RecoveryEventHandler = (data?: unknown) => void;

interface RecoveryState {
    isRecovering: boolean;
    lastCheck: number;
    pendingRecovery: boolean;
    networkOnline: boolean;
}

// ============================================================================
// RecoveryManager Class
// ============================================================================

export class RecoveryManager {
    private state: RecoveryState = {
        isRecovering: false,
        lastCheck: 0,
        pendingRecovery: false,
        networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };

    private listeners: Map<RecoveryEvent, Set<RecoveryEventHandler>> = new Map();
    private checkInterval: ReturnType<typeof setInterval> | null = null;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Bound handlers for cleanup
    private boundHandlers = {
        onVisibilityChange: this.handleVisibilityChange.bind(this),
        onFocus: this.handleFocus.bind(this),
        onOnline: this.handleOnline.bind(this),
        onOffline: this.handleOffline.bind(this),
        onPageShow: this.handlePageShow.bind(this),
    };

    constructor() {
        this.setupEventListeners();
        this.startHealthCheckInterval();
    }

    // ---------------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------------

    /**
     * Start the recovery manager.
     * Sets up all event listeners for detecting interruptions.
     */
    private setupEventListeners(): void {
        if (typeof document === 'undefined') return;

        // Visibility change - primary trigger for mobile recovery
        document.addEventListener('visibilitychange', this.boundHandlers.onVisibilityChange);

        // Window focus - backup trigger
        window.addEventListener('focus', this.boundHandlers.onFocus);

        // Network changes
        window.addEventListener('online', this.boundHandlers.onOnline);
        window.addEventListener('offline', this.boundHandlers.onOffline);

        // Page show - for bfcache restoration
        window.addEventListener('pageshow', this.boundHandlers.onPageShow);

        console.log('[RecoveryManager] Event listeners set up');
    }

    /**
     * Start periodic health checks.
     */
    private startHealthCheckInterval(): void {
        if (this.checkInterval) return;

        this.checkInterval = setInterval(() => {
            this.performHealthCheck();
        }, AUDIO_CONFIG.HEALTH_CHECK_INTERVAL_MS);
    }

    /**
     * Stop the recovery manager and clean up.
     */
    dispose(): void {
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.boundHandlers.onVisibilityChange);
            window.removeEventListener('focus', this.boundHandlers.onFocus);
            window.removeEventListener('online', this.boundHandlers.onOnline);
            window.removeEventListener('offline', this.boundHandlers.onOffline);
            window.removeEventListener('pageshow', this.boundHandlers.onPageShow);
        }

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        this.listeners.clear();
    }

    // ---------------------------------------------------------------------------
    // Event Handlers
    // ---------------------------------------------------------------------------

    /**
     * Handle visibility change (tab/app foreground).
     * This is the PRIMARY mobile recovery trigger.
     */
    private handleVisibilityChange(): void {
        if (document.visibilityState === 'visible') {
            console.log('[RecoveryManager] App became visible, checking health...');
            this.scheduleRecoveryCheck();
        }
    }

    /**
     * Handle window focus.
     * Backup trigger for desktop browsers.
     */
    private handleFocus(): void {
        console.log('[RecoveryManager] Window focused, checking health...');
        this.scheduleRecoveryCheck();
    }

    /**
     * Handle network coming online.
     */
    private handleOnline(): void {
        console.log('[RecoveryManager] Network online');
        this.state.networkOnline = true;
        this.emit('networkChanged', { online: true });

        // Network restored - check if we need track recovery too
        this.scheduleRecoveryCheck();
    }

    /**
     * Handle network going offline.
     */
    private handleOffline(): void {
        console.log('[RecoveryManager] Network offline');
        this.state.networkOnline = false;
        this.emit('networkChanged', { online: false });
    }

    /**
     * Handle page show (bfcache restoration).
     * Fired when page is restored from back-forward cache.
     */
    private handlePageShow(event: PageTransitionEvent): void {
        if (event.persisted) {
            console.log('[RecoveryManager] Page restored from bfcache, checking health...');
            this.scheduleRecoveryCheck();
        }
    }

    // ---------------------------------------------------------------------------
    // Health Check & Recovery
    // ---------------------------------------------------------------------------

    /**
     * Schedule a debounced recovery check.
     * Prevents rapid re-checks when multiple events fire.
     */
    private scheduleRecoveryCheck(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.performHealthCheck();
        }, AUDIO_CONFIG.VISIBILITY_DEBOUNCE_MS);
    }

    /**
     * Perform a health check on the audio track.
     * Triggers recovery if needed.
     */
    private performHealthCheck(): void {
        const audioManager = getAudioManager();
        const state = audioManager.getState();

        // Only check if we're supposed to have an active stream
        if (state.status === 'idle') return;

        this.state.lastCheck = Date.now();

        // Check if track is healthy
        if (!audioManager.isReady()) {
            console.log('[RecoveryManager] Track unhealthy, triggering recovery...');
            this.emit('recoveryNeeded');
            this.triggerRecovery();
        }
    }

    /**
     * Trigger the recovery process.
     */
    private async triggerRecovery(): Promise<void> {
        if (this.state.isRecovering) {
            console.log('[RecoveryManager] Recovery already in progress');
            this.state.pendingRecovery = true;
            return;
        }

        this.state.isRecovering = true;
        this.emit('recoveryStarted');

        const audioManager = getAudioManager();
        const success = await audioManager.attemptRecovery();

        this.state.isRecovering = false;

        if (success) {
            console.log('[RecoveryManager] Recovery successful');
            this.emit('recoveryCompleted');
        } else {
            console.log('[RecoveryManager] Recovery failed');
            this.emit('recoveryFailed');
        }

        // Handle any pending recovery request
        if (this.state.pendingRecovery) {
            this.state.pendingRecovery = false;
            // Small delay before retrying
            setTimeout(() => this.triggerRecovery(), 500);
        }
    }

    /**
     * Force a recovery attempt.
     * Called when user explicitly requests reconnection.
     */
    async forceRecovery(): Promise<boolean> {
        console.log('[RecoveryManager] Forcing recovery...');

        const audioManager = getAudioManager();

        // Reset recovery attempts for a fresh start
        audioManager.dispose();

        const track = await audioManager.requestMic();
        return track !== null;
    }

    // ---------------------------------------------------------------------------
    // State Accessors
    // ---------------------------------------------------------------------------

    isRecovering(): boolean {
        return this.state.isRecovering;
    }

    isNetworkOnline(): boolean {
        return this.state.networkOnline;
    }

    // ---------------------------------------------------------------------------
    // Event Emitter
    // ---------------------------------------------------------------------------

    on(event: RecoveryEvent, handler: RecoveryEventHandler): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
    }

    off(event: RecoveryEvent, handler: RecoveryEventHandler): void {
        this.listeners.get(event)?.delete(handler);
    }

    private emit(event: RecoveryEvent, data?: unknown): void {
        this.listeners.get(event)?.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`[RecoveryManager] Error in ${event} handler:`, error);
            }
        });
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let recoveryManagerInstance: RecoveryManager | null = null;

export function getRecoveryManager(): RecoveryManager {
    if (!recoveryManagerInstance) {
        recoveryManagerInstance = new RecoveryManager();
    }
    return recoveryManagerInstance;
}

export function destroyRecoveryManager(): void {
    if (recoveryManagerInstance) {
        recoveryManagerInstance.dispose();
        recoveryManagerInstance = null;
    }
}
