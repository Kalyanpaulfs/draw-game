/**
 * Voice Module - Public Exports
 * 
 * Central export point for the voice chat system.
 */

// AudioManager
export { AudioManager, getAudioManager } from './AudioManager';

// PeerManager
export { PeerManager } from './PeerManager';

// Signaling
export { VoiceSignaling } from './VoiceSignaling';

// Recovery
export { RecoveryManager, getRecoveryManager, destroyRecoveryManager } from './RecoveryManager';

// React Context
export { VoiceProvider, useVoiceContext } from './VoiceContext';

// WebRTC Config
export {
    RTC_CONFIG,
    ICE_SERVERS,
    optimizeSdpForVoice,
    prioritizeOpus,
} from './webrtc-config';

// Types
export type {
    AudioStatus,
    AudioManagerState,
    AudioEvent,
    AudioEventHandler,
} from './types';

export type {
    PeerConnectionInfo,
    PeerEvent,
    SignalingMessage,
} from './webrtc-config';

export type { VoiceStatus } from './VoiceContext';
export type { RecoveryEvent } from './RecoveryManager';

export { VOICE_AUDIO_CONSTRAINTS, AUDIO_CONFIG } from './types';
