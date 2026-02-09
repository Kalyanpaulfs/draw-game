/**
 * MicButton - Floating Microphone Button
 * 
 * Features:
 * - Circular floating design
 * - Draggable with pointer events
 * - Position persisted in localStorage
 * - Visual states: muted, unmuted, reconnecting
 * - Constrained to viewport
 * 
 * INTEGRATION:
 * - Communicates ONLY with VoiceContext
 * - NO direct media logic
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVoiceContext } from '@/lib/voice';

// ============================================================================
// Constants
// ============================================================================

const BUTTON_SIZE = 56; // px
const EDGE_PADDING = 16; // px from viewport edges
const STORAGE_KEY = 'voice-mic-button-position';

interface Position {
    x: number;
    y: number;
}

// ============================================================================
// Component
// ============================================================================

export function MicButton() {
    const {
        status,
        isMuted,
        isConnected,
        isReconnecting,
        toggleMute,
        joinVoice,
        leaveVoice,
        forceReconnect,
    } = useVoiceContext();

    // Position state
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Refs
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dragStartRef = useRef<{ x: number; y: number; buttonX: number; buttonY: number } | null>(null);

    // ---------------------------------------------------------------------------
    // Initialize Position
    // ---------------------------------------------------------------------------

    useEffect(() => {
        // Load saved position or default to bottom-right
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Position;
                setPosition(constrainToViewport(parsed));
            } catch {
                setPosition(getDefaultPosition());
            }
        } else {
            setPosition(getDefaultPosition());
        }

        setIsInitialized(true);
    }, []);

    // ---------------------------------------------------------------------------
    // Save Position
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (isInitialized && !isDragging) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        }
    }, [position, isInitialized, isDragging]);

    // ---------------------------------------------------------------------------
    // Viewport Constraint
    // ---------------------------------------------------------------------------

    const constrainToViewport = useCallback((pos: Position): Position => {
        if (typeof window === 'undefined') return pos;

        const maxX = window.innerWidth - BUTTON_SIZE - EDGE_PADDING;
        const maxY = window.innerHeight - BUTTON_SIZE - EDGE_PADDING;

        return {
            x: Math.max(EDGE_PADDING, Math.min(pos.x, maxX)),
            y: Math.max(EDGE_PADDING, Math.min(pos.y, maxY)),
        };
    }, []);

    const getDefaultPosition = (): Position => {
        if (typeof window === 'undefined') {
            return { x: EDGE_PADDING, y: EDGE_PADDING };
        }
        return {
            x: window.innerWidth - BUTTON_SIZE - EDGE_PADDING,
            y: window.innerHeight - BUTTON_SIZE - EDGE_PADDING - 80, // Above potential bottom nav
        };
    };

    // ---------------------------------------------------------------------------
    // Drag Handling
    // ---------------------------------------------------------------------------

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();

        const button = buttonRef.current;
        if (!button) return;

        button.setPointerCapture(e.pointerId);

        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            buttonX: position.x,
            buttonY: position.y,
        };

        setIsDragging(true);
    }, [position]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging || !dragStartRef.current) return;

        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        const newPos = constrainToViewport({
            x: dragStartRef.current.buttonX + deltaX,
            y: dragStartRef.current.buttonY + deltaY,
        });

        setPosition(newPos);
    }, [isDragging, constrainToViewport]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;

        const button = buttonRef.current;
        if (button) {
            button.releasePointerCapture(e.pointerId);
        }

        const dragStart = dragStartRef.current;
        if (dragStart) {
            const deltaX = Math.abs(e.clientX - dragStart.x);
            const deltaY = Math.abs(e.clientY - dragStart.y);

            // If movement was minimal, treat as a click
            if (deltaX < 5 && deltaY < 5) {
                handleClick();
            }
        }

        dragStartRef.current = null;
        setIsDragging(false);
    }, [isDragging]);

    // ---------------------------------------------------------------------------
    // Click Handler
    // ---------------------------------------------------------------------------

    const handleClick = useCallback(() => {
        switch (status) {
            case 'disconnected':
                joinVoice();
                break;
            case 'connected':
                toggleMute();
                break;
            case 'error':
                forceReconnect();
                break;
            case 'reconnecting':
                // Do nothing while reconnecting
                break;
            case 'connecting':
                // Do nothing while connecting
                break;
        }
    }, [status, joinVoice, toggleMute, forceReconnect]);

    // Long press to leave
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLongPressStart = useCallback(() => {
        if (status === 'connected') {
            longPressTimer.current = setTimeout(() => {
                leaveVoice();
            }, 1000);
        }
    }, [status, leaveVoice]);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // ---------------------------------------------------------------------------
    // Resize Handler
    // ---------------------------------------------------------------------------

    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => constrainToViewport(prev));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [constrainToViewport]);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    if (!isInitialized) return null;

    return (
        <button
            ref={buttonRef}
            className={`
        fixed z-50 flex items-center justify-center rounded-full
        shadow-lg transition-all duration-200
        touch-none select-none cursor-grab
        ${isDragging ? 'cursor-grabbing scale-110' : 'active:scale-95'}
        ${getButtonClasses(status, isMuted)}
      `}
            style={{
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                left: position.x,
                top: position.y,
            }}
            onPointerDown={(e) => {
                handlePointerDown(e);
                handleLongPressStart();
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => {
                handlePointerUp(e);
                handleLongPressEnd();
            }}
            onPointerCancel={(e) => {
                handlePointerUp(e);
                handleLongPressEnd();
            }}
            aria-label={getAriaLabel(status, isMuted)}
        >
            {/* Icon */}
            {getIcon(status, isMuted, isReconnecting)}

            {/* Pulse animation for reconnecting */}
            {isReconnecting && (
                <span className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-50" />
            )}

            {/* Connection indicator */}
            {isConnected && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-lg" />
            )}
        </button>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getButtonClasses(status: string, isMuted: boolean): string {
    switch (status) {
        case 'disconnected':
            return 'bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400';
        case 'connecting':
            return 'bg-indigo-600 text-white animate-pulse';
        case 'connected':
            if (isMuted) {
                return 'bg-red-600 hover:bg-red-500 text-white';
            }
            return 'bg-emerald-600 hover:bg-emerald-500 text-white';
        case 'reconnecting':
            return 'bg-yellow-600 text-white';
        case 'error':
            return 'bg-red-800 hover:bg-red-700 text-white border border-red-500';
        default:
            return 'bg-slate-800 text-slate-400';
    }
}

function getIcon(status: string, isMuted: boolean, isReconnecting: boolean): React.ReactNode {
    // Spinner for connecting/reconnecting
    if (status === 'connecting' || isReconnecting) {
        return (
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
        );
    }

    // Error icon
    if (status === 'error') {
        return (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        );
    }

    // Muted mic
    if (isMuted || status === 'disconnected') {
        return (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
        );
    }

    // Active mic
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
    );
}

function getAriaLabel(status: string, isMuted: boolean): string {
    switch (status) {
        case 'disconnected':
            return 'Join voice chat';
        case 'connecting':
            return 'Connecting to voice chat...';
        case 'connected':
            return isMuted ? 'Unmute microphone' : 'Mute microphone';
        case 'reconnecting':
            return 'Reconnecting to voice chat...';
        case 'error':
            return 'Voice chat error. Tap to retry.';
        default:
            return 'Voice chat';
    }
}
