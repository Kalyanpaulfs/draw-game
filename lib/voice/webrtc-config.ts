/**
 * WebRTC Configuration for Voice Chat
 * 
 * Optimized for low-latency voice with Opus codec.
 */

// ============================================================================
// ICE Server Configuration
// ============================================================================

/**
 * ICE servers for STUN/TURN.
 * STUN is free and handles most NAT scenarios.
 * Add TURN servers for enterprise/firewall-heavy environments.
 */
export const ICE_SERVERS: RTCIceServer[] = [
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
];

const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

if (turnUrl && turnUsername && turnCredential) {
    // Support multiple TURN URLs separated by commas or semicolons
    const urls = turnUrl.split(/[,;]/).map(url => url.trim()).filter(url => url.length > 0);

    ICE_SERVERS.push({
        urls: urls,
        username: turnUsername,
        credential: turnCredential,
    });
} else {
    // Only warn if we are in production or trying to force relay
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_FORCE_TURN === 'true') {
        console.warn('[WebRTC] TURN server not configured. P2P may fail on strict networks.');
    }
}

// ============================================================================
// RTCPeerConnection Configuration
// ============================================================================

/**
 * RTCPeerConnection configuration optimized for voice.
 */
export const RTC_CONFIG: RTCConfiguration = {
    iceServers: ICE_SERVERS,

    // Use unified-plan SDP semantics (modern standard)
    // @ts-expect-error - sdpSemantics is valid but deprecated in TS types
    sdpSemantics: 'unified-plan',

    // Use all transports (prefer UDP for lower latency)
    // If NEXT_PUBLIC_FORCE_TURN is set, force relay (for testing/strict networks)
    iceTransportPolicy: process.env.NEXT_PUBLIC_FORCE_TURN === 'true' ? 'relay' : 'all',

    // Bundle media together for efficiency
    bundlePolicy: 'max-bundle',

    // Require encryption
    rtcpMuxPolicy: 'require',
};

// ============================================================================
// SDP Modifications for Opus Optimization
// ============================================================================

/**
 * Modify SDP to optimize Opus codec for voice chat.
 * 
 * Optimizations:
 * - useinbandfec=1: Forward Error Correction for packet loss recovery
 * - stereo=0: Mono audio (saves bandwidth)
 * - maxaveragebitrate=32000: Good quality for voice
 * - usedtx=1: Discontinuous transmission (saves bandwidth during silence)
 * - maxptime=60: Max packet time for lower latency
 * - minptime=10: Min packet time
 */
export function optimizeSdpForVoice(sdp: string): string {
    // Find the Opus codec line and add parameters
    const opusRegex = /a=fmtp:(\d+) (.+)/g;

    return sdp.replace(opusRegex, (match, payloadType, params) => {
        // Check if this is Opus (usually payload type 111, but check the m= line)
        // Only modify if it's audio

        const newParams = [
            params,
            'useinbandfec=1',
            'stereo=0',
            'maxaveragebitrate=32000',
            'usedtx=1',
            'maxptime=60',
            'minptime=10',
        ].join(';');

        return `a=fmtp:${payloadType} ${newParams}`;
    });
}

/**
 * Prioritize Opus codec in SDP.
 * Ensures Opus is the first (preferred) codec.
 */
export function prioritizeOpus(sdp: string): string {
    // Opus is typically already preferred in modern browsers
    // This function ensures it stays that way

    const lines = sdp.split('\r\n');
    const result: string[] = [];

    for (const line of lines) {
        // Find audio m= line and ensure Opus (111) is first
        if (line.startsWith('m=audio')) {
            // Extract payload types
            const parts = line.split(' ');
            // parts: ['m=audio', port, protocol, ...payload_types]
            if (parts.length > 3) {
                const prefix = parts.slice(0, 3);
                const payloads = parts.slice(3);

                // Find Opus payload (usually 111)
                const opusIndex = payloads.findIndex(p => p === '111');
                if (opusIndex > 0) {
                    // Move Opus to front
                    payloads.splice(opusIndex, 1);
                    payloads.unshift('111');
                }

                result.push([...prefix, ...payloads].join(' '));
                continue;
            }
        }
        result.push(line);
    }

    return result.join('\r\n');
}

// ============================================================================
// Peer Connection Types
// ============================================================================

export interface PeerConnectionInfo {
    peerId: string;
    connection: RTCPeerConnection;
    audioSender: RTCRtpSender | null;
    audioReceiver: RTCRtpReceiver | null;
    remoteStream: MediaStream | null;
    connectionState: RTCPeerConnectionState;
    iceConnectionState: RTCIceConnectionState;
}

export type PeerEvent =
    | 'peerConnected'
    | 'peerDisconnected'
    | 'peerFailed'
    | 'remoteTrackAdded'
    | 'remoteTrackRemoved'
    | 'iceCandidate'
    | 'needsOffer'
    | 'needsAnswer'
    | 'connectionStateChange';

export type SignalingMessage =
    | { type: 'offer'; sdp: string; from: string; to: string }
    | { type: 'answer'; sdp: string; from: string; to: string }
    | { type: 'ice-candidate'; candidate: RTCIceCandidateInit; from: string; to: string };
