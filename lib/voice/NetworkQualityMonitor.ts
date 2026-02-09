/**
 * NetworkQualityMonitor - WebRTC Connection Quality Monitoring
 * 
 * Monitors RTCPeerConnection stats to detect:
 * - Packet loss
 * - Jitter
 * - Round-trip time
 * - Connection quality degradation
 * 
 * Provides quality indicators for UI feedback.
 */

import { PeerConnectionInfo } from './webrtc-config';

// ============================================================================
// Types
// ============================================================================

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface NetworkStats {
    // Packet loss
    packetLossPercent: number;

    // Jitter (in ms)
    jitter: number;

    // Round-trip time (in ms)
    roundTripTime: number;

    // Bitrate
    bitrate: number;

    // Overall quality assessment
    quality: ConnectionQuality;

    // Timestamp
    timestamp: number;
}

// Thresholds for quality assessment
const QUALITY_THRESHOLDS = {
    packetLoss: {
        excellent: 0,
        good: 1,
        fair: 3,
        poor: 5,
        // Above 5% = critical
    },
    jitter: {
        excellent: 10,
        good: 30,
        fair: 50,
        poor: 100,
        // Above 100ms = critical
    },
    rtt: {
        excellent: 100,
        good: 200,
        fair: 400,
        poor: 800,
        // Above 800ms = critical
    },
} as const;

// ============================================================================
// NetworkQualityMonitor Class
// ============================================================================

export class NetworkQualityMonitor {
    private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
    private stats: Map<string, NetworkStats> = new Map();
    private onQualityChange?: (peerId: string, quality: ConnectionQuality) => void;

    constructor(onQualityChange?: (peerId: string, quality: ConnectionQuality) => void) {
        this.onQualityChange = onQualityChange;
    }

    /**
     * Start monitoring a peer connection.
     */
    startMonitoring(peerInfo: PeerConnectionInfo, intervalMs = 2000): void {
        const { peerId, connection } = peerInfo;

        // Don't duplicate
        if (this.intervals.has(peerId)) return;

        const interval = setInterval(async () => {
            try {
                const stats = await this.collectStats(connection);
                const prevQuality = this.stats.get(peerId)?.quality;

                this.stats.set(peerId, stats);

                // Notify on quality change
                if (stats.quality !== prevQuality && this.onQualityChange) {
                    this.onQualityChange(peerId, stats.quality);
                }
            } catch (error) {
                console.error(`[NetworkQualityMonitor] Error collecting stats for ${peerId}:`, error);
            }
        }, intervalMs);

        this.intervals.set(peerId, interval);
    }

    /**
     * Stop monitoring a peer connection.
     */
    stopMonitoring(peerId: string): void {
        const interval = this.intervals.get(peerId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(peerId);
        }
        this.stats.delete(peerId);
    }

    /**
     * Stop all monitoring.
     */
    dispose(): void {
        for (const peerId of this.intervals.keys()) {
            this.stopMonitoring(peerId);
        }
    }

    /**
     * Get current stats for a peer.
     */
    getStats(peerId: string): NetworkStats | undefined {
        return this.stats.get(peerId);
    }

    /**
     * Get overall quality (worst among all peers).
     */
    getOverallQuality(): ConnectionQuality {
        if (this.stats.size === 0) return 'excellent';

        const qualities: ConnectionQuality[] = Array.from(this.stats.values()).map(s => s.quality);
        const priority: ConnectionQuality[] = ['critical', 'poor', 'fair', 'good', 'excellent'];

        for (const q of priority) {
            if (qualities.includes(q)) return q;
        }

        return 'excellent';
    }

    /**
     * Collect stats from a peer connection.
     */
    private async collectStats(connection: RTCPeerConnection): Promise<NetworkStats> {
        const report = await connection.getStats();

        let packetLossPercent = 0;
        let jitter = 0;
        let roundTripTime = 0;
        let bitrate = 0;

        report.forEach((stat) => {
            // Inbound RTP stats (audio we receive)
            if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
                if (stat.packetsLost !== undefined && stat.packetsReceived !== undefined) {
                    const total = stat.packetsLost + stat.packetsReceived;
                    packetLossPercent = total > 0 ? (stat.packetsLost / total) * 100 : 0;
                }
                if (stat.jitter !== undefined) {
                    jitter = stat.jitter * 1000; // Convert to ms
                }
            }

            // Remote inbound RTP stats (our audio as seen by remote)
            if (stat.type === 'remote-inbound-rtp' && stat.kind === 'audio') {
                if (stat.roundTripTime !== undefined) {
                    roundTripTime = stat.roundTripTime * 1000; // Convert to ms
                }
            }

            // Outbound RTP stats (audio we send)
            if (stat.type === 'outbound-rtp' && stat.kind === 'audio') {
                if (stat.bytesSent !== undefined) {
                    // This would need previous timestamp to calculate actual bitrate
                    bitrate = stat.bytesSent;
                }
            }
        });

        const quality = this.assessQuality(packetLossPercent, jitter, roundTripTime);

        return {
            packetLossPercent,
            jitter,
            roundTripTime,
            bitrate,
            quality,
            timestamp: Date.now(),
        };
    }

    /**
     * Assess overall quality from individual metrics.
     */
    private assessQuality(packetLoss: number, jitter: number, rtt: number): ConnectionQuality {
        // Check each metric and return worst quality
        const plQuality = this.getMetricQuality(packetLoss, QUALITY_THRESHOLDS.packetLoss);
        const jitterQuality = this.getMetricQuality(jitter, QUALITY_THRESHOLDS.jitter);
        const rttQuality = this.getMetricQuality(rtt, QUALITY_THRESHOLDS.rtt);

        const priority: ConnectionQuality[] = ['critical', 'poor', 'fair', 'good', 'excellent'];

        for (const q of priority) {
            if (plQuality === q || jitterQuality === q || rttQuality === q) {
                return q;
            }
        }

        return 'excellent';
    }

    /**
     * Get quality level for a single metric.
     */
    private getMetricQuality(
        value: number,
        thresholds: { excellent: number; good: number; fair: number; poor: number }
    ): ConnectionQuality {
        if (value <= thresholds.excellent) return 'excellent';
        if (value <= thresholds.good) return 'good';
        if (value <= thresholds.fair) return 'fair';
        if (value <= thresholds.poor) return 'poor';
        return 'critical';
    }
}

// ============================================================================
// Quality Display Helpers
// ============================================================================

/**
 * Get display color for quality level.
 */
export function getQualityColor(quality: ConnectionQuality): string {
    switch (quality) {
        case 'excellent': return '#10b981'; // emerald-500
        case 'good': return '#22c55e'; // green-500
        case 'fair': return '#eab308'; // yellow-500
        case 'poor': return '#f97316'; // orange-500
        case 'critical': return '#ef4444'; // red-500
    }
}

/**
 * Get display label for quality level.
 */
export function getQualityLabel(quality: ConnectionQuality): string {
    switch (quality) {
        case 'excellent': return 'Excellent';
        case 'good': return 'Good';
        case 'fair': return 'Fair';
        case 'poor': return 'Poor';
        case 'critical': return 'Critical';
    }
}

/**
 * Get quality icon (signal bars representation).
 */
export function getQualityBars(quality: ConnectionQuality): number {
    switch (quality) {
        case 'excellent': return 4;
        case 'good': return 3;
        case 'fair': return 2;
        case 'poor': return 1;
        case 'critical': return 0;
    }
}
