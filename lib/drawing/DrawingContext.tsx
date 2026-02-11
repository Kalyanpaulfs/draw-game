/**
 * DrawingContext - React Context for Real-Time Drawing via WebRTC DataChannel
 *
 * Integrates DrawingChannel and StrokeHistory to provide:
 * - Real-time stroke streaming (drawer → all peers)
 * - Canvas state synchronization (rejoin recovery)
 * - Undo/redo/clear operations over DataChannel
 */

'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useCallback,
    useState,
    ReactNode,
} from 'react';
import { DrawingChannel } from './DrawingChannel';
import { StrokeHistory } from './StrokeHistory';
import {
    DrawingMessage,
    Stroke,
    DrawPoint,
    DRAWING_CHANNEL_LABEL,
} from './DrawingTypes';
import { PeerManager } from '@/lib/voice/PeerManager';

// ============================================================================
// Types
// ============================================================================

interface DrawingContextValue {
    // Stroke state
    strokes: readonly Stroke[];
    strokeVersion: number; // Increments on any change, triggers re-render

    // Actions (only meaningful for drawer, but safe to call by anyone)
    startStroke: (strokeId: string, color: string, brushSize: number, point: DrawPoint) => void;
    addPoint: (strokeId: string, point: DrawPoint) => void;
    endStroke: (strokeId: string) => void;
    addDot: (strokeId: string, color: string, brushSize: number, point: DrawPoint) => void;
    undoStroke: () => void;
    redoStroke: () => void;
    clearBoard: () => void;
    resetDrawing: () => void;

    // State
    isChannelReady: boolean;
}

interface DrawingProviderProps {
    children: ReactNode;
    peerManager: PeerManager | null;
    roomId: string;
    userId: string;
    isDrawer: boolean;
    drawerId: string;
    phase?: string;
}

// ============================================================================
// Context
// ============================================================================

const DrawingContext = createContext<DrawingContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function DrawingProvider({
    children,
    peerManager,
    roomId,
    userId,
    isDrawer,
    drawerId,
    phase,
}: DrawingProviderProps) {
    const drawingChannelRef = useRef<DrawingChannel | null>(null);
    const strokeHistoryRef = useRef<StrokeHistory>(new StrokeHistory());
    const [strokeVersion, setStrokeVersion] = useState(0);
    const [isChannelReady, setIsChannelReady] = useState(false);

    // Track whether we've requested state for this session
    const hasRequestedStateRef = useRef(false);

    // Bump version to trigger re-render
    const bumpVersion = useCallback(() => {
        setStrokeVersion(v => v + 1);
    }, []);

    // -------------------------------------------------------------------------
    // Handle incoming drawing messages
    // -------------------------------------------------------------------------

    const handleDrawingMessage = useCallback((peerId: string, message: DrawingMessage) => {
        const history = strokeHistoryRef.current;
        const channel = drawingChannelRef.current;

        switch (message.type) {
            case 'stroke-start':
                history.addStroke(message.strokeId, message.color, message.brushSize, message.point);
                bumpVersion();
                break;

            case 'stroke-point':
                history.appendPoints(message.strokeId, message.points);
                bumpVersion();
                break;

            case 'stroke-end':
                history.finalizeStroke(message.strokeId);
                bumpVersion();
                break;

            case 'dot':
                history.addDot(message.strokeId, message.color, message.brushSize, message.point);
                bumpVersion();
                break;

            case 'clear':
                history.clear();
                bumpVersion();
                break;

            case 'undo':
                history.undo();
                bumpVersion();
                break;

            case 'redo':
                history.redo();
                bumpVersion();
                break;

            case 'state-request':
                // Only the drawer/authority responds to state requests
                if (isDrawerRef.current && channel) {
                    const state = history.getFullState();
                    channel.sendTo(peerId, {
                        type: 'state-response',
                        strokes: state,
                    });
                    console.log(`[DrawingContext] Responding to state-request from ${peerId} with ${state.length} strokes`);
                }
                break;

            case 'state-response':
                history.applyFullState(message.strokes);
                bumpVersion();
                console.log(`[DrawingContext] Received state (${message.strokes.length} strokes)`);
                break;
        }
    }, [isDrawer, bumpVersion]);

    // -------------------------------------------------------------------------
    // Initialize DrawingChannel and wire to PeerManager
    // Use refs for isDrawer and handleDrawingMessage so the effect doesn't
    // re-run when those values change (which would kill the DataChannel).
    // -------------------------------------------------------------------------

    const isDrawerRef = useRef(isDrawer);
    isDrawerRef.current = isDrawer;

    const handleDrawingMessageRef = useRef(handleDrawingMessage);
    handleDrawingMessageRef.current = handleDrawingMessage;

    useEffect(() => {
        if (!peerManager) return;

        const drawingChannel = new DrawingChannel({
            onMessage: (peerId, message) => {
                handleDrawingMessageRef.current(peerId, message);
            },
            onChannelStateChange: (peerId, state) => {
                const channel = drawingChannelRef.current;
                const connectedPeers = channel?.getConnectedPeers() || [];
                setIsChannelReady(connectedPeers.length > 0);

                if (state === 'open') {
                    console.log(`[DrawingContext] Channel open for ${peerId}, isDrawer=${isDrawerRef.current}`);
                } else if (state === 'closed') {
                    // If this was our only peer, reset the requested flag so we re-request on next peer
                    if (connectedPeers.length === 0) {
                        hasRequestedStateRef.current = false;
                    }
                    console.log(`[DrawingContext] Channel closed for ${peerId}`);
                }
            },
        });

        drawingChannelRef.current = drawingChannel;

        // Register with PeerManager to receive DataChannel events.
        // This also replays any existing DataChannels that were created
        // before DrawingProvider mounted (e.g. during voice join in lobby).
        peerManager.setOnDataChannel((peerId: string, channel: RTCDataChannel) => {
            drawingChannel.acceptChannel(peerId, channel);
        });

        console.log(`[DrawingContext] DrawingChannel initialized`);

        return () => {
            peerManager.setOnDataChannel(undefined);
            drawingChannel.dispose();
            drawingChannelRef.current = null;
        };
        // Only depend on peerManager and userId — NOT isDrawer or handleDrawingMessage
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [peerManager, userId]);

    // -------------------------------------------------------------------------
    // Reset drawing state when drawer changes (new turn)
    // -------------------------------------------------------------------------

    useEffect(() => {
        // Clear board when turn changes or a new turn cycle starts
        console.log(`[DrawingContext] Turn transition: drawer=${drawerId}, phase=${phase}`);
        hasRequestedStateRef.current = false;
        strokeHistoryRef.current.clear();
        bumpVersion();
    }, [drawerId, phase, bumpVersion]);

    // -------------------------------------------------------------------------
    // Resync Logic: Request state if we are a guesser and a channel is ready
    // -------------------------------------------------------------------------

    useEffect(() => {
        const channel = drawingChannelRef.current;
        if (!channel || isDrawer || hasRequestedStateRef.current) return;

        // Ensure the drawer itself is connected before requesting
        if (drawerId && channel.isConnected(drawerId)) {
            hasRequestedStateRef.current = true;
            channel.sendTo(drawerId, {
                type: 'state-request',
                from: userId,
            });
            console.log(`[DrawingContext] Requesting resync state specifically from drawer ${drawerId}`);
        }
    }, [isDrawer, isChannelReady, drawerId, userId]);

    // -------------------------------------------------------------------------
    // Drawing Actions (for drawer)
    // -------------------------------------------------------------------------

    const startStroke = useCallback((strokeId: string, color: string, brushSize: number, point: DrawPoint) => {
        const history = strokeHistoryRef.current;
        const channel = drawingChannelRef.current;

        history.addStroke(strokeId, color, brushSize, point);
        bumpVersion();

        if (isDrawer && channel) {
            channel.broadcast({
                type: 'stroke-start',
                strokeId,
                color,
                brushSize,
                point,
            });
        }
    }, [isDrawer, bumpVersion]);

    const addPoint = useCallback((strokeId: string, point: DrawPoint) => {
        const history = strokeHistoryRef.current;
        const channel = drawingChannelRef.current;

        history.appendPoints(strokeId, [point]);
        bumpVersion();

        if (isDrawer && channel) {
            channel.queuePoint(strokeId, point);
        }
    }, [isDrawer, bumpVersion]);

    const endStroke = useCallback((strokeId: string) => {
        const history = strokeHistoryRef.current;
        const channel = drawingChannelRef.current;

        history.finalizeStroke(strokeId);
        bumpVersion();

        if (isDrawer && channel) {
            // Flush any remaining batched points first
            channel.flushPoints();
            channel.broadcast({
                type: 'stroke-end',
                strokeId,
            });
        }
    }, [isDrawer, bumpVersion]);

    const addDot = useCallback((strokeId: string, color: string, brushSize: number, point: DrawPoint) => {
        const history = strokeHistoryRef.current;
        const channel = drawingChannelRef.current;

        history.addDot(strokeId, color, brushSize, point);
        bumpVersion();

        if (isDrawer && channel) {
            channel.broadcast({
                type: 'dot',
                strokeId,
                color,
                brushSize,
                point,
            });
        }
    }, [isDrawer, bumpVersion]);

    const undoStroke = useCallback(() => {
        const history = strokeHistoryRef.current;
        const channel = drawingChannelRef.current;

        const removed = history.undo();
        if (removed) {
            bumpVersion();
            if (isDrawer && channel) {
                channel.broadcast({ type: 'undo' });
            }
        }
    }, [isDrawer, bumpVersion]);

    const redoStroke = useCallback(() => {
        const history = strokeHistoryRef.current;
        const channel = drawingChannelRef.current;

        const restored = history.redo();
        if (restored) {
            bumpVersion();
            if (isDrawer && channel) {
                channel.broadcast({ type: 'redo' });
            }
        }
    }, [isDrawer, bumpVersion]);

    const clearBoard = useCallback(() => {
        const history = strokeHistoryRef.current;
        const channel = drawingChannelRef.current;

        history.clear();
        bumpVersion();

        if (isDrawer && channel) {
            channel.broadcast({ type: 'clear' });
        }
    }, [isDrawer, bumpVersion]);

    const resetDrawing = useCallback(() => {
        strokeHistoryRef.current.clear();
        hasRequestedStateRef.current = false;
        bumpVersion();
    }, [bumpVersion]);

    // -------------------------------------------------------------------------
    // Public method to accept DataChannels from PeerManager
    // -------------------------------------------------------------------------

    // Expose acceptChannel as a stable ref for external wiring
    const acceptChannel = useCallback((peerId: string, channel: RTCDataChannel) => {
        if (channel.label === DRAWING_CHANNEL_LABEL) {
            drawingChannelRef.current?.acceptChannel(peerId, channel);
        }
    }, []);

    // Store acceptChannel on a ref so VoiceContext integration can call it
    const acceptChannelRef = useRef(acceptChannel);
    acceptChannelRef.current = acceptChannel;

    // -------------------------------------------------------------------------
    // Context Value
    // -------------------------------------------------------------------------

    const value: DrawingContextValue = {
        strokes: strokeHistoryRef.current.getStrokes(),
        strokeVersion,
        startStroke,
        addPoint,
        endStroke,
        addDot,
        undoStroke,
        redoStroke,
        clearBoard,
        resetDrawing,
        isChannelReady,
    };

    return (
        <DrawingContext.Provider value={value}>
            {children}
        </DrawingContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useDrawing(): DrawingContextValue {
    const context = useContext(DrawingContext);
    if (!context) {
        throw new Error('useDrawing must be used within a DrawingProvider');
    }
    return context;
}
