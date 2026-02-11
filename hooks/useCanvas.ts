"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDrawing } from "@/lib/drawing";
import { DrawPoint, Stroke } from "@/lib/drawing/DrawingTypes";

export type { DrawPoint as Point };

// Generate a unique stroke ID
let strokeCounter = 0;
function generateStrokeId(): string {
    return `s_${Date.now()}_${++strokeCounter}`;
}

export function useCanvas(isDrawer: boolean) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);
    const isDrawing = useRef(false);
    const currentStrokeId = useRef<string | null>(null);
    const moveCount = useRef(0);
    const startPoint = useRef<DrawPoint | null>(null);

    const {
        strokes,
        strokeVersion,
        startStroke,
        addPoint,
        endStroke,
        addDot,
        undoStroke,
        redoStroke,
        clearBoard: clearDrawing,
    } = useDrawing();

    // -------------------------------------------------------------------------
    // Canvas Rendering
    // -------------------------------------------------------------------------

    /** Draw a single dot (filled circle) */
    const drawDot = useCallback((ctx: CanvasRenderingContext2D, point: DrawPoint, dotColor: string, dotSize: number) => {
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(
            point.x * ctx.canvas.width,
            point.y * ctx.canvas.height,
            dotSize / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }, []);

    /** Draw a stroke with smoothing */
    const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        const { points, color: strokeColor, brushSize } = stroke;

        // Single-point stroke → render as dot
        if (points.length === 1) {
            drawDot(ctx, points[0], strokeColor, brushSize);
            return;
        }

        if (points.length < 2) return;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();

        ctx.moveTo(points[0].x * ctx.canvas.width, points[0].y * ctx.canvas.height);

        for (let i = 1; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            ctx.quadraticCurveTo(
                p1.x * ctx.canvas.width,
                p1.y * ctx.canvas.height,
                midX * ctx.canvas.width,
                midY * ctx.canvas.height
            );
        }

        const last = points[points.length - 1];
        ctx.lineTo(last.x * ctx.canvas.width, last.y * ctx.canvas.height);
        ctx.stroke();
    }, [drawDot]);

    // Re-render canvas whenever strokes change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        console.log(`[useCanvas] Repainting ${strokes.length} strokes (v=${strokeVersion})`);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const stroke of strokes) {
            drawStroke(ctx, stroke);
        }
    }, [strokeVersion, strokes, drawStroke]);

    // Safety: stop drawing if role changes during a stroke
    useEffect(() => {
        if (!isDrawer) {
            isDrawing.current = false;
            currentStrokeId.current = null;
        }
    }, [isDrawer]);

    // -------------------------------------------------------------------------
    // Drawing Event Handlers
    // -------------------------------------------------------------------------

    const handleStartDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawer || !canvasRef.current) return;

        const point = getPoint(e, canvasRef.current);
        if (!point) return;

        isDrawing.current = true;
        moveCount.current = 0;
        startPoint.current = point;

        const strokeId = generateStrokeId();
        currentStrokeId.current = strokeId;

        startStroke(strokeId, color, size, point);
    }, [isDrawer, color, size, startStroke]);

    const handleDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawer || !isDrawing.current || !canvasRef.current || !currentStrokeId.current) return;

        const point = getPoint(e, canvasRef.current);
        if (!point) return;

        moveCount.current++;
        addPoint(currentStrokeId.current, point);
    }, [isDrawer, addPoint]);

    const handleStopDrawing = useCallback(() => {
        if (!isDrawer || !isDrawing.current) return;
        isDrawing.current = false;

        const strokeId = currentStrokeId.current;
        if (!strokeId) return;

        // Detect dot: no movement at all
        if (moveCount.current === 0 && startPoint.current) {
            // This was a single-tap — the stroke-start already registered 1 point.
            // Just finalize it — it'll render as a dot (single-point stroke).
            endStroke(strokeId);
        } else {
            endStroke(strokeId);
        }

        currentStrokeId.current = null;
        startPoint.current = null;
    }, [isDrawer, endStroke]);

    // -------------------------------------------------------------------------
    // Undo / Redo / Clear
    // -------------------------------------------------------------------------

    const undo = useCallback(() => {
        if (!isDrawer) return;
        undoStroke();
    }, [isDrawer, undoStroke]);

    const redo = useCallback(() => {
        if (!isDrawer) return;
        redoStroke();
    }, [isDrawer, redoStroke]);

    const clearBoard = useCallback(() => {
        if (!isDrawer) return;
        clearDrawing();
    }, [isDrawer, clearDrawing]);

    return {
        canvasRef,
        color,
        setColor,
        size,
        setSize,
        clearBoard,
        startDrawing: handleStartDrawing,
        draw: handleDraw,
        stopDrawing: handleStopDrawing,
        undo,
        redo,
    };
}

// ============================================================================
// Helpers
// ============================================================================

function getPoint(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement): DrawPoint | null {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
    };
}
