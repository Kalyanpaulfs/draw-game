/**
 * Drawing Module - Public Exports
 */

export { DrawingChannel } from './DrawingChannel';
export { StrokeHistory } from './StrokeHistory';
export { DrawingProvider, useDrawing } from './DrawingContext';

export type {
    DrawPoint,
    Stroke,
    DrawingMessage,
    StrokeStartMessage,
    StrokePointMessage,
    StrokeEndMessage,
    DotMessage,
    ClearMessage,
    UndoMessage,
    RedoMessage,
    StateRequestMessage,
    StateResponseMessage,
} from './DrawingTypes';

export {
    DRAWING_CHANNEL_LABEL,
    DRAWING_CHANNEL_OPTIONS,
    POINT_BATCH_INTERVAL_MS,
} from './DrawingTypes';
