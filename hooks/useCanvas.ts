"use client";

import { useEffect, useRef, useState } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/lib/types";

export type Point = { x: number; y: number };

export type Stroke = {
    id?: string;
    color: string;
    size: number;
    points: Point[];
    timestamp: Timestamp;
};

export function useCanvas(roomId: string, userId: string, isDrawer: boolean) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);
    const isDrawing = useRef(false);
    const currentStroke = useRef<Point[]>([]);

    // Draw a single stroke with smoothing
    const drawStroke = (ctx: CanvasRenderingContext2D, points: Point[], strokeColor: string, strokeSize: number) => {
        if (points.length < 2) return;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();

        // Move to first point
        ctx.moveTo(points[0].x * ctx.canvas.width, points[0].y * ctx.canvas.height);

        // Draw curves between points
        for (let i = 1; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            // Calculate midpoint
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            // Quadratic curve to midpoint using p1 as control point
            ctx.quadraticCurveTo(
                p1.x * ctx.canvas.width,
                p1.y * ctx.canvas.height,
                midX * ctx.canvas.width,
                midY * ctx.canvas.height
            );
        }

        // Draw last line segment to the final point
        const last = points[points.length - 1];
        ctx.lineTo(last.x * ctx.canvas.width, last.y * ctx.canvas.height);

        ctx.stroke();
    };

    // Sync: Listen for incoming strokes
    useEffect(() => {
        if (!roomId || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const strokesRef = collection(db, "rooms", roomId, "draw_strokes");
        const q = query(strokesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Opt: We could clear and redraw everything to handle deletions/clearing board
            // Or just draw new additions. For "Clear Board", we need to detect a full wipe.
            // If snapshot is empty but we have content, it means board was cleared.

            if (snapshot.empty) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            // If multiple changes, easier to redraw all for correctness (z-index)
            // Limitation: Performance dip if 1000s of strokes. 
            // Optimization: Only redraw if "type === modified" or "removed".
            // For MVP: Redraw all on every snapshot is safest implementation.
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            snapshot.forEach((doc) => {
                const data = doc.data() as Stroke;
                drawStroke(ctx, data.points, data.color, data.size);
            });
        });

        return () => unsubscribe();
    }, [roomId]);

    // Local Drawing Handlers
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawer || !canvasRef.current) return;
        isDrawing.current = true;
        const point = getPoint(e, canvasRef.current);
        if (point) currentStroke.current = [point];
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawer || !isDrawing.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const point = getPoint(e, canvasRef.current);
        if (!point) return;

        // Draw locally immediately
        const lastPoint = currentStroke.current[currentStroke.current.length - 1];

        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(lastPoint.x * ctx.canvas.width, lastPoint.y * ctx.canvas.height);
        ctx.lineTo(point.x * ctx.canvas.width, point.y * ctx.canvas.height);
        ctx.stroke();

        currentStroke.current.push(point);
    };

    const stopDrawing = async () => {
        if (!isDrawer || !isDrawing.current) return;
        isDrawing.current = false;

        if (currentStroke.current.length > 0) {
            // Sync to Firestore
            try {
                await addDoc(collection(db, "rooms", roomId, "draw_strokes"), {
                    color,
                    size,
                    points: currentStroke.current,
                    timestamp: Timestamp.now(),
                });
            } catch (e) {
                console.error("Failed to save stroke", e);
            }
        }
        currentStroke.current = [];
    };

    const clearBoard = async () => {
        // Delete all documents in subcollection
        // Note: Client-side delete of all docs is slow/costly. 
        // Better: Admin/Server action. 
        // MVP Hack: Iterate and delete.
        const strokesRef = collection(db, "rooms", roomId, "draw_strokes");
        const snapshot = await getDocs(strokesRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    };

    return {
        canvasRef,
        color,
        setColor,
        size,
        setSize,
        clearBoard,
        startDrawing,
        draw,
        stopDrawing,
    };
}

// Helper to get normalized 0-1 coordinates
function getPoint(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement): Point | null {
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

    return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
    };
}
