/**
 * PeerManager - WebRTC Peer Connection Manager
 * 
 * Manages multiple RTCPeerConnections for voice chat.
 * Does NOT own mic/track logic - that's AudioManager's job.
 * 
 * FIXES IMPLEMENTED:
 * 1. ICE candidate queuing until remote description is set
 * 2. Signaling state checks before SDP operations
 * 3. Proper handling of duplicate/concurrent offers
 * 4. Rollback for glare situations (simultaneous offers)
 */

import {
    RTC_CONFIG,
    optimizeSdpForVoice,
    prioritizeOpus,
    PeerConnectionInfo,
    PeerEvent,
    SignalingMessage,
} from './webrtc-config';
import {
    DRAWING_CHANNEL_LABEL,
    DRAWING_CHANNEL_OPTIONS,
} from '../drawing/DrawingTypes';
import { getAudioManager } from './AudioManager';

// ============================================================================
// Types
// ============================================================================

type PeerEventHandler = (data: unknown) => void;

interface PeerManagerOptions {
    localUserId: string;
    onSignalingMessage: (message: SignalingMessage) => void;
    onRemoteStream: (peerId: string, stream: MediaStream) => void;
    onRemoteStreamRemoved: (peerId: string) => void;
    onDataChannel?: (peerId: string, channel: RTCDataChannel) => void;
}

// Extended peer info with ICE candidate queue
interface ExtendedPeerInfo extends PeerConnectionInfo {
    iceCandidateQueue: RTCIceCandidateInit[];
    hasRemoteDescription: boolean;
    isNegotiating: boolean;
    makingOffer: boolean;
    dataChannel?: RTCDataChannel;
}

// ============================================================================
// PeerManager Class
// ============================================================================

export class PeerManager {
    private localUserId: string;
    private peers: Map<string, ExtendedPeerInfo> = new Map();
    private listeners: Map<PeerEvent, Set<PeerEventHandler>> = new Map();
    private onSignalingMessage: (message: SignalingMessage) => void;
    private onRemoteStream: (peerId: string, stream: MediaStream) => void;
    private onRemoteStreamRemoved: (peerId: string) => void;
    private onDataChannel?: (peerId: string, channel: RTCDataChannel) => void;

    // Track subscription to AudioManager
    private audioManagerSubscribed = false;

    constructor(options: PeerManagerOptions) {
        this.localUserId = options.localUserId;
        this.onSignalingMessage = options.onSignalingMessage;
        this.onRemoteStream = options.onRemoteStream;
        this.onRemoteStreamRemoved = options.onRemoteStreamRemoved;
        this.onDataChannel = options.onDataChannel;

        // Subscribe to AudioManager track events
        this.subscribeToAudioManager();
    }

    // ---------------------------------------------------------------------------
    // AudioManager Integration
    // ---------------------------------------------------------------------------

    private subscribeToAudioManager(): void {
        if (this.audioManagerSubscribed) return;

        const audioManager = getAudioManager();

        audioManager.on('recoverySuccess', (newTrack) => {
            this.replaceTrackOnAllPeers(newTrack as MediaStreamTrack);
        });

        audioManager.on('trackReady', (track) => {
            this.replaceTrackOnAllPeers(track as MediaStreamTrack);
        });

        this.audioManagerSubscribed = true;
    }

    async replaceTrackOnAllPeers(newTrack: MediaStreamTrack): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const [peerId, peerInfo] of this.peers) {
            if (peerInfo.audioSender) {
                promises.push(
                    peerInfo.audioSender.replaceTrack(newTrack)
                        .then(() => {
                            console.log(`[PeerManager] Replaced track for peer: ${peerId}`);
                        })
                        .catch((error) => {
                            console.error(`[PeerManager] Failed to replace track for peer ${peerId}:`, error);
                        })
                );
            }
        }

        await Promise.all(promises);
    }

    // ---------------------------------------------------------------------------
    // Peer Lifecycle
    // ---------------------------------------------------------------------------

    async createPeer(peerId: string, isInitiator: boolean): Promise<void> {
        // If peer exists, check if connection is still valid
        const existingPeer = this.peers.get(peerId);
        if (existingPeer) {
            const state = existingPeer.connection.connectionState;
            // Only skip if connection is actually working
            if (state === 'connected' || state === 'connecting') {
                console.log(`[PeerManager] Peer ${peerId} already exists and is ${state}`);
                return;
            }
            // Otherwise remove the stale connection
            this.removePeer(peerId);
        }

        console.log(`[PeerManager] Creating peer: ${peerId}, initiator: ${isInitiator}`);

        const connection = new RTCPeerConnection(RTC_CONFIG);

        const peerInfo: ExtendedPeerInfo = {
            peerId,
            connection,
            audioSender: null,
            audioReceiver: null,
            remoteStream: null,
            connectionState: connection.connectionState,
            iceConnectionState: connection.iceConnectionState,
            iceCandidateQueue: [],
            hasRemoteDescription: false,
            isNegotiating: false,
            makingOffer: false,
        };

        this.peers.set(peerId, peerInfo);
        this.setupConnectionHandlers(peerInfo);

        // Add local audio track if available
        const audioManager = getAudioManager();
        const track = audioManager.getTrack();
        const stream = audioManager.getStream();

        if (track && stream) {
            // Track is ready - add it directly
            const sender = connection.addTrack(track, stream);
            peerInfo.audioSender = sender;
            console.log(`[PeerManager] Added track to peer ${peerId}`);
        } else {
            // No track yet - add transceiver with sendrecv so we can add track later
            // Using sendrecv (not recvonly) allows us to replace with actual track
            const transceiver = connection.addTransceiver('audio', { direction: 'sendrecv' });
            peerInfo.audioSender = transceiver.sender;
            console.log(`[PeerManager] Added sendrecv transceiver for peer ${peerId}`);
        }

        // Create drawing DataChannel if we're the initiator
        if (isInitiator) {
            const drawingChannel = connection.createDataChannel(
                DRAWING_CHANNEL_LABEL,
                DRAWING_CHANNEL_OPTIONS
            );
            peerInfo.dataChannel = drawingChannel;
            this.onDataChannel?.(peerId, drawingChannel);
            console.log(`[PeerManager] Created drawing DataChannel for ${peerId}`);
        }

        // If we're the initiator, create offer
        if (isInitiator) {
            await this.createAndSendOffer(peerId);
        }
    }

    removePeer(peerId: string): void {
        const peerInfo = this.peers.get(peerId);
        if (!peerInfo) return;

        console.log(`[PeerManager] Removing peer: ${peerId}`);

        peerInfo.connection.close();

        if (peerInfo.remoteStream) {
            this.onRemoteStreamRemoved(peerId);
        }

        this.peers.delete(peerId);
        this.emit('peerDisconnected', { peerId });
    }

    removeAllPeers(): void {
        for (const peerId of this.peers.keys()) {
            this.removePeer(peerId);
        }
    }

    dispose(): void {
        this.removeAllPeers();
        this.listeners.clear();
        this.audioManagerSubscribed = false;
    }

    // ---------------------------------------------------------------------------
    // Signaling: Offer/Answer/ICE
    // ---------------------------------------------------------------------------

    private async createAndSendOffer(peerId: string): Promise<void> {
        const peerInfo = this.peers.get(peerId);
        if (!peerInfo) return;

        // Prevent simultaneous offers
        if (peerInfo.makingOffer) {
            console.log(`[PeerManager] Already making offer for ${peerId}`);
            return;
        }

        peerInfo.makingOffer = true;

        try {
            const offer = await peerInfo.connection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false,
            });

            // Check signaling state before setting local description
            if (peerInfo.connection.signalingState !== 'stable') {
                console.log(`[PeerManager] Signaling state not stable for ${peerId}, skipping offer`);
                return;
            }

            const optimizedSdp = prioritizeOpus(optimizeSdpForVoice(offer.sdp || ''));
            offer.sdp = optimizedSdp;

            await peerInfo.connection.setLocalDescription(offer);

            this.onSignalingMessage({
                type: 'offer',
                sdp: optimizedSdp,
                from: this.localUserId,
                to: peerId,
            });
        } catch (error) {
            console.error(`[PeerManager] Failed to create offer for ${peerId}:`, error);
        } finally {
            peerInfo.makingOffer = false;
        }
    }

    async handleOffer(fromPeerId: string, sdp: string): Promise<void> {
        let peerInfo = this.peers.get(fromPeerId);

        // Create peer if it doesn't exist
        if (!peerInfo) {
            await this.createPeer(fromPeerId, false);
            peerInfo = this.peers.get(fromPeerId);
        }

        if (!peerInfo) {
            console.error(`[PeerManager] Failed to create peer for offer from ${fromPeerId}`);
            return;
        }

        const connection = peerInfo.connection;

        try {
            // Handle "glare" - both sides sent offers simultaneously
            // The "polite" peer (lower ID) will rollback
            const isPolite = this.localUserId < fromPeerId;
            const collision = peerInfo.makingOffer || connection.signalingState !== 'stable';

            if (collision) {
                if (!isPolite) {
                    // We're impolite, ignore their offer
                    console.log(`[PeerManager] Ignoring colliding offer from ${fromPeerId} (we're impolite)`);
                    return;
                }
                // We're polite, rollback our offer
                console.log(`[PeerManager] Rolling back our offer for ${fromPeerId} (we're polite)`);
                await connection.setLocalDescription({ type: 'rollback' });
            }

            await connection.setRemoteDescription({
                type: 'offer',
                sdp,
            });

            peerInfo.hasRemoteDescription = true;

            // Process queued ICE candidates
            await this.processIceCandidateQueue(fromPeerId);

            // Create answer
            const answer = await connection.createAnswer();
            const optimizedSdp = prioritizeOpus(optimizeSdpForVoice(answer.sdp || ''));
            answer.sdp = optimizedSdp;

            await connection.setLocalDescription(answer);

            this.onSignalingMessage({
                type: 'answer',
                sdp: optimizedSdp,
                from: this.localUserId,
                to: fromPeerId,
            });
        } catch (error) {
            console.error(`[PeerManager] Failed to handle offer from ${fromPeerId}:`, error);
        }
    }

    async handleAnswer(fromPeerId: string, sdp: string): Promise<void> {
        const peerInfo = this.peers.get(fromPeerId);
        if (!peerInfo) {
            console.warn(`[PeerManager] Received answer from unknown peer: ${fromPeerId}`);
            return;
        }

        const connection = peerInfo.connection;

        // Check if we're in a state to accept an answer
        if (connection.signalingState !== 'have-local-offer') {
            console.warn(`[PeerManager] Cannot set answer in state: ${connection.signalingState}`);
            return;
        }

        try {
            await connection.setRemoteDescription({
                type: 'answer',
                sdp,
            });

            peerInfo.hasRemoteDescription = true;

            // Process queued ICE candidates
            await this.processIceCandidateQueue(fromPeerId);

        } catch (error) {
            console.error(`[PeerManager] Failed to handle answer from ${fromPeerId}:`, error);
        }
    }

    async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
        const peerInfo = this.peers.get(fromPeerId);
        if (!peerInfo) {
            console.warn(`[PeerManager] Received ICE candidate from unknown peer: ${fromPeerId}`);
            return;
        }

        // Queue the candidate if we don't have remote description yet
        if (!peerInfo.hasRemoteDescription) {
            console.log(`[PeerManager] Queuing ICE candidate from ${fromPeerId}`);
            peerInfo.iceCandidateQueue.push(candidate);
            return;
        }

        // Add the candidate
        try {
            await peerInfo.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error(`[PeerManager] Failed to add ICE candidate from ${fromPeerId}:`, error);
        }
    }

    private async processIceCandidateQueue(peerId: string): Promise<void> {
        const peerInfo = this.peers.get(peerId);
        if (!peerInfo || peerInfo.iceCandidateQueue.length === 0) return;

        console.log(`[PeerManager] Processing ${peerInfo.iceCandidateQueue.length} queued ICE candidates for ${peerId}`);

        const queue = [...peerInfo.iceCandidateQueue];
        peerInfo.iceCandidateQueue = [];

        for (const candidate of queue) {
            try {
                await peerInfo.connection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error(`[PeerManager] Failed to add queued ICE candidate:`, error);
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Connection Event Handlers
    // ---------------------------------------------------------------------------

    private setupConnectionHandlers(peerInfo: ExtendedPeerInfo): void {
        const { connection, peerId } = peerInfo;

        // ICE candidate generation
        connection.onicecandidate = (event) => {
            if (event.candidate) {
                this.onSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate.toJSON(),
                    from: this.localUserId,
                    to: peerId,
                });
            }
        };

        // Connection state changes
        connection.onconnectionstatechange = () => {
            peerInfo.connectionState = connection.connectionState;
            console.log(`[PeerManager] Peer ${peerId} connection state: ${connection.connectionState}`);
            this.emit('connectionStateChange', { peerId, state: connection.connectionState });

            switch (connection.connectionState) {
                case 'connected':
                    this.emit('peerConnected', { peerId });
                    // After ICE restart, the old DataChannel may have closed.
                    // Recreate it if we're the initiator and the old one is dead.
                    if (peerInfo.dataChannel && peerInfo.dataChannel.readyState !== 'open') {
                        const isInitiator = this.localUserId < peerId;
                        if (isInitiator) {
                            console.log(`[PeerManager] Recreating DataChannel for ${peerId} after reconnection`);
                            const newChannel = connection.createDataChannel(
                                DRAWING_CHANNEL_LABEL,
                                DRAWING_CHANNEL_OPTIONS
                            );
                            peerInfo.dataChannel = newChannel;
                            this.onDataChannel?.(peerId, newChannel);
                        }
                    }

                    // Log connection stats to verify TURN usage
                    connection.getStats().then(stats => {
                        stats.forEach(report => {
                            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                                const localCandidate = stats.get(report.localCandidateId);
                                const remoteCandidate = stats.get(report.remoteCandidateId);
                                console.log(`[PeerManager] Active Pair for ${peerId}:`,
                                    `${localCandidate?.candidateType} <-> ${remoteCandidate?.candidateType}`,
                                    `(Protocol: ${localCandidate?.protocol})`
                                );
                            }
                        });
                    }).catch(e => console.error('[PeerManager] Failed to get stats:', e));

                    break;
                case 'disconnected':
                    this.emit('peerDisconnected', { peerId });
                    // Disconnected can be transient (e.g. switching wifi/cellular).
                    // If it stays disconnected for 5s, try ICE restart.
                    console.log(`[PeerManager] Peer ${peerId} disconnected. Waiting for recovery...`);
                    setTimeout(() => {
                        const currentPeer = this.peers.get(peerId);
                        if (currentPeer && currentPeer.connection.connectionState === 'disconnected') {
                            console.log(`[PeerManager] Peer ${peerId} still disconnected after 5s. Triggering ICE restart.`);
                            this.restartIce(peerId);
                        }
                    }, 5000);
                    break;
                case 'closed':
                    this.emit('peerDisconnected', { peerId });
                    break;
                case 'failed':
                    this.emit('peerFailed', { peerId });
                    // Try ICE restart first for production resilience
                    console.log(`[PeerManager] Connection failed for ${peerId}, attempting ICE restart...`);
                    this.restartIce(peerId);

                    // Fallback to full recreation if ICE restart doesn't work after 10s
                    setTimeout(() => {
                        const currentPeer = this.peers.get(peerId);
                        if (currentPeer && (currentPeer.connection.connectionState === 'failed' || currentPeer.connection.connectionState === 'disconnected')) {
                            console.log(`[PeerManager] ICE restart failed for ${peerId}, recreating peer completely.`);
                            this.removePeer(peerId);
                            const isInitiator = this.localUserId < peerId;
                            this.createPeer(peerId, isInitiator);
                        }
                    }, 10000);
                    break;
            }
        };

        // ICE connection state changes
        connection.oniceconnectionstatechange = () => {
            peerInfo.iceConnectionState = connection.iceConnectionState;
            console.log(`[PeerManager] Peer ${peerId} ICE state: ${connection.iceConnectionState}`);
        };

        // Signaling state changes (for debugging)
        connection.onsignalingstatechange = () => {
            console.log(`[PeerManager] Peer ${peerId} signaling state: ${connection.signalingState}`);
        };

        // Remote track received
        connection.ontrack = (event) => {
            console.log(`[PeerManager] Received remote track from ${peerId}`);

            const stream = event.streams[0];
            if (stream) {
                peerInfo.remoteStream = stream;
                peerInfo.audioReceiver = event.receiver;
                this.onRemoteStream(peerId, stream);
                this.emit('remoteTrackAdded', { peerId, stream });
            }
        };

        // Incoming DataChannel (for non-initiator side)
        connection.ondatachannel = (event) => {
            const channel = event.channel;
            console.log(`[PeerManager] Received DataChannel '${channel.label}' from ${peerId}`);
            if (channel.label === DRAWING_CHANNEL_LABEL) {
                peerInfo.dataChannel = channel;
                this.onDataChannel?.(peerId, channel);
            }
        };
    }

    public async restartIce(peerId: string): Promise<void> {
        const peerInfo = this.peers.get(peerId);
        if (!peerInfo) return;

        console.log(`[PeerManager] Restarting ICE for peer: ${peerId}`);

        try {
            const offer = await peerInfo.connection.createOffer({ iceRestart: true });
            const optimizedSdp = prioritizeOpus(optimizeSdpForVoice(offer.sdp || ''));
            offer.sdp = optimizedSdp;

            await peerInfo.connection.setLocalDescription(offer);

            this.onSignalingMessage({
                type: 'offer',
                sdp: optimizedSdp,
                from: this.localUserId,
                to: peerId,
            });
        } catch (error) {
            console.error(`[PeerManager] Failed to restart ICE for ${peerId}:`, error);
        }
    }

    // ---------------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------------

    getConnectedPeers(): string[] {
        return Array.from(this.peers.entries())
            .filter(([, info]) => info.connectionState === 'connected')
            .map(([peerId]) => peerId);
    }

    getPeerInfo(peerId: string): PeerConnectionInfo | undefined {
        return this.peers.get(peerId);
    }

    getAllPeers(): Map<string, PeerConnectionInfo> {
        return new Map(this.peers);
    }

    /**
     * Set the DataChannel callback (allows late binding by DrawingContext).
     * Replays existing channels to the new handler so late-mounting consumers
     * don't miss channels created during voice join.
     */
    setOnDataChannel(handler: ((peerId: string, channel: RTCDataChannel) => void) | undefined): void {
        this.onDataChannel = handler;

        // Replay existing DataChannels to the new handler
        if (handler) {
            for (const [peerId, peerInfo] of this.peers) {
                if (peerInfo.dataChannel) {
                    console.log(`[PeerManager] Replaying DataChannel for ${peerId}`);
                    handler(peerId, peerInfo.dataChannel);
                }
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Event Emitter
    // ---------------------------------------------------------------------------

    on(event: PeerEvent, handler: PeerEventHandler): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
    }

    off(event: PeerEvent, handler: PeerEventHandler): void {
        this.listeners.get(event)?.delete(handler);
    }

    private emit(event: PeerEvent, data?: unknown): void {
        this.listeners.get(event)?.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`[PeerManager] Error in ${event} handler:`, error);
            }
        });
    }
}
