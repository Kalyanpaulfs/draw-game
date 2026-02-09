/**
 * VoiceSignaling - Firebase Signaling for WebRTC
 * 
 * Handles SDP offer/answer exchange and ICE candidate relay.
 * Uses Firebase Realtime Database / Firestore for signaling.
 */

import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    Timestamp,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SignalingMessage } from './webrtc-config';

// ============================================================================
// Types
// ============================================================================

interface VoiceSignalingOptions {
    roomId: string;
    localUserId: string;
    onMessage: (message: SignalingMessage) => void;
}

// ============================================================================
// VoiceSignaling Class
// ============================================================================

export class VoiceSignaling {
    private roomId: string;
    private localUserId: string;
    private onMessage: (message: SignalingMessage) => void;
    private unsubscribe: Unsubscribe | null = null;

    constructor(options: VoiceSignalingOptions) {
        this.roomId = options.roomId;
        this.localUserId = options.localUserId;
        this.onMessage = options.onMessage;
    }

    // ---------------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------------

    /**
     * Start listening for signaling messages.
     */
    start(): void {
        if (this.unsubscribe) return;

        const signalingRef = collection(db, 'rooms', this.roomId, 'signaling');

        // Listen for messages addressed to us
        const q = query(signalingRef, where('to', '==', this.localUserId));

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();

                    // Process the message
                    const message = this.parseMessage(data);
                    if (message) {
                        this.onMessage(message);
                    }

                    // Delete the message after processing (one-time delivery)
                    try {
                        await deleteDoc(change.doc.ref);
                    } catch (error) {
                        console.error('[VoiceSignaling] Failed to delete message:', error);
                    }
                }
            });
        }, (error) => {
            console.error('[VoiceSignaling] Snapshot error:', error);
        });
    }

    /**
     * Stop listening for signaling messages.
     */
    stop(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    // ---------------------------------------------------------------------------
    // Send Messages
    // ---------------------------------------------------------------------------

    /**
     * Send a signaling message to another peer.
     */
    async send(message: SignalingMessage): Promise<void> {
        const signalingRef = collection(db, 'rooms', this.roomId, 'signaling');
        const docRef = doc(signalingRef);

        try {
            await setDoc(docRef, {
                ...message,
                timestamp: Timestamp.now(),
            });
        } catch (error) {
            console.error('[VoiceSignaling] Failed to send message:', error);
            throw error;
        }
    }

    /**
     * Send an SDP offer.
     */
    async sendOffer(to: string, sdp: string): Promise<void> {
        await this.send({
            type: 'offer',
            sdp,
            from: this.localUserId,
            to,
        });
    }

    /**
     * Send an SDP answer.
     */
    async sendAnswer(to: string, sdp: string): Promise<void> {
        await this.send({
            type: 'answer',
            sdp,
            from: this.localUserId,
            to,
        });
    }

    /**
     * Send an ICE candidate.
     */
    async sendIceCandidate(to: string, candidate: RTCIceCandidateInit): Promise<void> {
        await this.send({
            type: 'ice-candidate',
            candidate,
            from: this.localUserId,
            to,
        });
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Parse a Firestore document into a SignalingMessage.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseMessage(data: any): SignalingMessage | null {
        try {
            switch (data.type) {
                case 'offer':
                    return {
                        type: 'offer',
                        sdp: data.sdp,
                        from: data.from,
                        to: data.to,
                    };
                case 'answer':
                    return {
                        type: 'answer',
                        sdp: data.sdp,
                        from: data.from,
                        to: data.to,
                    };
                case 'ice-candidate':
                    return {
                        type: 'ice-candidate',
                        candidate: data.candidate,
                        from: data.from,
                        to: data.to,
                    };
                default:
                    console.warn('[VoiceSignaling] Unknown message type:', data.type);
                    return null;
            }
        } catch (error) {
            console.error('[VoiceSignaling] Failed to parse message:', error);
            return null;
        }
    }
}
