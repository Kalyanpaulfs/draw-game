/**
 * DrawingTypes - Message Protocol for WebRTC Drawing DataChannel
 *
 * Defines all message types exchanged between peers for real-time drawing.
 */

// ============================================================================
// Point & Stroke Types
// ============================================================================

export interface DrawPoint {
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
}

export interface Stroke {
    strokeId: string;
    color: string;
    brushSize: number;
    points: DrawPoint[];
    isFinal: boolean;
}

// ============================================================================
// DataChannel Message Types
// ============================================================================

/** Begin a new stroke */
export interface StrokeStartMessage {
    type: 'stroke-start';
    strokeId: string;
    color: string;
    brushSize: number;
    point: DrawPoint;
}

/** Append points to an active stroke (batched for performance) */
export interface StrokePointMessage {
    type: 'stroke-point';
    strokeId: string;
    points: DrawPoint[];
}

/** Finalize a stroke */
export interface StrokeEndMessage {
    type: 'stroke-end';
    strokeId: string;
}

/** Single-tap dot */
export interface DotMessage {
    type: 'dot';
    strokeId: string;
    color: string;
    brushSize: number;
    point: DrawPoint;
}

/** Clear the entire board */
export interface ClearMessage {
    type: 'clear';
}

/** Undo last stroke */
export interface UndoMessage {
    type: 'undo';
}

/** Redo last undone stroke */
export interface RedoMessage {
    type: 'redo';
}

/** Request full canvas state (sent by rejoiner) */
export interface StateRequestMessage {
    type: 'state-request';
    from: string; // userId of the requester
}

/** Full canvas state response (sent by authority/drawer) */
export interface StateResponseMessage {
    type: 'state-response';
    strokes: Stroke[];
}

/** Union of all drawing messages */
export type DrawingMessage =
    | StrokeStartMessage
    | StrokePointMessage
    | StrokeEndMessage
    | DotMessage
    | ClearMessage
    | UndoMessage
    | RedoMessage
    | StateRequestMessage
    | StateResponseMessage;

// ============================================================================
// Constants
// ============================================================================

export const DRAWING_CHANNEL_LABEL = 'drawing';

export const DRAWING_CHANNEL_OPTIONS: RTCDataChannelInit = {
    ordered: true, // Strokes must arrive in order
    // No maxRetransmits — fully reliable
};

/** Max send rate for point batching (~30 Hz) */
export const POINT_BATCH_INTERVAL_MS = 33;
