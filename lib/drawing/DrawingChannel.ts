/**
 * DrawingChannel - WebRTC DataChannel Manager for Drawing
 *
 * Manages DataChannel creation/reception on existing RTCPeerConnections.
 * Handles message serialization, throttled point batching, and event dispatch.
 */

import {
    DrawingMessage,
    DrawPoint,
    DRAWING_CHANNEL_LABEL,
    DRAWING_CHANNEL_OPTIONS,
    POINT_BATCH_INTERVAL_MS,
} from './DrawingTypes';

// ============================================================================
// Types
// ============================================================================

type DrawingMessageHandler = (peerId: string, message: DrawingMessage) => void;
type ChannelStateHandler = (peerId: string, state: 'open' | 'closed') => void;

interface DrawingChannelOptions {
    onMessage: DrawingMessageHandler;
    onChannelStateChange?: ChannelStateHandler;
}

// ============================================================================
// DrawingChannel Class
// ============================================================================

export class DrawingChannel {
    private channels: Map<string, RTCDataChannel> = new Map();
    private onMessage: DrawingMessageHandler;
    private onChannelStateChange?: ChannelStateHandler;

    // Point batching state
    private pendingPoints: Map<string, DrawPoint[]> = new Map(); // strokeId -> points
    private batchTimer: ReturnType<typeof setInterval> | null = null;
    private broadcastFn: ((data: string) => void) | null = null;

    constructor(options: DrawingChannelOptions) {
        this.onMessage = options.onMessage;
        this.onChannelStateChange = options.onChannelStateChange;
    }

    // -------------------------------------------------------------------------
    // Channel Lifecycle
    // -------------------------------------------------------------------------

    /**
     * Create a DataChannel on an existing RTCPeerConnection (called by initiator).
     */
    createChannel(peerId: string, connection: RTCPeerConnection): void {
        if (this.channels.has(peerId)) {
            console.log(`[DrawingChannel] Channel already exists for ${peerId}`);
            return;
        }

        const channel = connection.createDataChannel(
            DRAWING_CHANNEL_LABEL,
            DRAWING_CHANNEL_OPTIONS
        );

        this.setupChannelHandlers(peerId, channel);
        this.channels.set(peerId, channel);
        console.log(`[DrawingChannel] Created channel for ${peerId}`);
    }

    /**
     * Accept an incoming DataChannel (called by responder via ondatachannel).
     */
    acceptChannel(peerId: string, channel: RTCDataChannel): void {
        if (channel.label !== DRAWING_CHANNEL_LABEL) return;

        // Replace existing channel if any
        const existing = this.channels.get(peerId);
        if (existing) {
            existing.onopen = null;
            existing.onclose = null;
            existing.onmessage = null;
        }

        this.setupChannelHandlers(peerId, channel);
        this.channels.set(peerId, channel);
        console.log(`[DrawingChannel] Accepted channel from ${peerId} (state: ${channel.readyState})`);

        // If the channel is already open (replayed from PeerManager), fire the
        // state change callback immediately since onopen won't re-fire.
        if (channel.readyState === 'open') {
            this.onChannelStateChange?.(peerId, 'open');
        }
    }

    /**
     * Remove a peer's channel. By default only detaches handlers
     * (the RTCDataChannel is owned by PeerManager).
     */
    removeChannel(peerId: string, closeChannel = false): void {
        const channel = this.channels.get(peerId);
        if (channel) {
            channel.onopen = null;
            channel.onclose = null;
            channel.onmessage = null;
            if (closeChannel && channel.readyState === 'open') {
                channel.close();
            }
            this.channels.delete(peerId);
        }
    }

    /**
     * Dispose all channels and stop batching.
     * Does NOT close the underlying RTCDataChannels (owned by PeerManager).
     */
    dispose(): void {
        this.stopBatching();
        for (const peerId of this.channels.keys()) {
            this.removeChannel(peerId, false);
        }
        this.channels.clear();
        this.pendingPoints.clear();
    }

    // -------------------------------------------------------------------------
    // Sending Messages
    // -------------------------------------------------------------------------

    /**
     * Send a drawing message to a specific peer.
     */
    sendTo(peerId: string, message: DrawingMessage): void {
        const channel = this.channels.get(peerId);
        if (channel && channel.readyState === 'open') {
            try {
                channel.send(JSON.stringify(message));
            } catch (error) {
                console.error(`[DrawingChannel] Failed to send to ${peerId}:`, error);
            }
        }
    }

    /**
     * Broadcast a drawing message to ALL connected peers.
     */
    broadcast(message: DrawingMessage): void {
        const data = JSON.stringify(message);
        for (const [peerId, channel] of this.channels) {
            if (channel.readyState === 'open') {
                try {
                    channel.send(data);
                } catch (error) {
                    console.error(`[DrawingChannel] Failed to broadcast to ${peerId}:`, error);
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Point Batching (Throttled Sending)
    // -------------------------------------------------------------------------

    /**
     * Queue a point for batched sending. Points are flushed at ~30Hz.
     */
    queuePoint(strokeId: string, point: DrawPoint): void {
        let points = this.pendingPoints.get(strokeId);
        if (!points) {
            points = [];
            this.pendingPoints.set(strokeId, points);
        }
        points.push(point);

        // Start batch timer if not running
        if (!this.batchTimer) {
            this.startBatching();
        }
    }

    /**
     * Flush all pending points immediately (e.g., on stroke end).
     */
    flushPoints(): void {
        for (const [strokeId, points] of this.pendingPoints) {
            if (points.length > 0) {
                this.broadcast({
                    type: 'stroke-point',
                    strokeId,
                    points: [...points],
                });
            }
        }
        this.pendingPoints.clear();
    }

    private startBatching(): void {
        if (this.batchTimer) return;

        this.batchTimer = setInterval(() => {
            let hadPoints = false;
            for (const [strokeId, points] of this.pendingPoints) {
                if (points.length > 0) {
                    hadPoints = true;
                    this.broadcast({
                        type: 'stroke-point',
                        strokeId,
                        points: [...points],
                    });
                    points.length = 0; // Clear the array
                }
            }

            // Stop timer if no points are pending
            if (!hadPoints) {
                this.stopBatching();
            }
        }, POINT_BATCH_INTERVAL_MS);
    }

    private stopBatching(): void {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }
    }

    // -------------------------------------------------------------------------
    // Channel State
    // -------------------------------------------------------------------------

    /**
     * Get all peer IDs with open channels.
     */
    getConnectedPeers(): string[] {
        return Array.from(this.channels.entries())
            .filter(([, ch]) => ch.readyState === 'open')
            .map(([peerId]) => peerId);
    }

    /**
     * Check if a specific peer has an open channel.
     */
    isConnected(peerId: string): boolean {
        const channel = this.channels.get(peerId);
        return channel?.readyState === 'open' || false;
    }

    // -------------------------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------------------------

    private setupChannelHandlers(peerId: string, channel: RTCDataChannel): void {
        channel.onopen = () => {
            console.log(`[DrawingChannel] Channel opened for ${peerId}`);
            this.onChannelStateChange?.(peerId, 'open');
        };

        channel.onclose = () => {
            console.log(`[DrawingChannel] Channel closed for ${peerId}`);
            this.channels.delete(peerId);
            this.onChannelStateChange?.(peerId, 'closed');
        };

        channel.onmessage = (event: MessageEvent) => {
            try {
                const message: DrawingMessage = JSON.parse(event.data);
                this.onMessage(peerId, message);
            } catch (error) {
                console.error(`[DrawingChannel] Failed to parse message from ${peerId}:`, error);
            }
        };
    }
}
