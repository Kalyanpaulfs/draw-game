/**
 * StrokeHistory - In-Memory Stroke State Manager
 *
 * Maintains canonical stroke list for the current turn.
 * Used by the drawing authority (drawer) to serve resync requests.
 */

import { Stroke, DrawPoint } from './DrawingTypes';

export class StrokeHistory {
    private strokes: Stroke[] = [];
    private undoStack: Stroke[] = [];

    // -------------------------------------------------------------------------
    // Stroke Lifecycle
    // -------------------------------------------------------------------------

    /** Start a new stroke */
    addStroke(strokeId: string, color: string, brushSize: number, firstPoint: DrawPoint): void {
        // Clear undo stack on new drawing action
        this.undoStack = [];

        this.strokes.push({
            strokeId,
            color,
            brushSize,
            points: [firstPoint],
            isFinal: false,
        });
    }

    /** Append points to an active (non-final) stroke */
    appendPoints(strokeId: string, points: DrawPoint[]): void {
        const stroke = this.strokes.find(s => s.strokeId === strokeId && !s.isFinal);
        if (stroke) {
            stroke.points.push(...points);
        }
    }

    /** Mark a stroke as finalized */
    finalizeStroke(strokeId: string): void {
        const stroke = this.strokes.find(s => s.strokeId === strokeId);
        if (stroke) {
            stroke.isFinal = true;
        }
    }

    /** Add a dot as a complete stroke (already final) */
    addDot(strokeId: string, color: string, brushSize: number, point: DrawPoint): void {
        this.undoStack = [];

        this.strokes.push({
            strokeId,
            color,
            brushSize,
            points: [point],
            isFinal: true,
        });
    }

    // -------------------------------------------------------------------------
    // Undo / Redo
    // -------------------------------------------------------------------------

    /** Remove last finalized stroke, push to undo stack */
    undo(): Stroke | null {
        // Find last finalized stroke
        for (let i = this.strokes.length - 1; i >= 0; i--) {
            if (this.strokes[i].isFinal) {
                const removed = this.strokes.splice(i, 1)[0];
                this.undoStack.push(removed);
                return removed;
            }
        }
        return null;
    }

    /** Restore last undone stroke */
    redo(): Stroke | null {
        const stroke = this.undoStack.pop();
        if (stroke) {
            this.strokes.push(stroke);
            return stroke;
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // Clear / Reset
    // -------------------------------------------------------------------------

    /** Clear all strokes and undo history */
    clear(): void {
        this.strokes = [];
        this.undoStack = [];
    }

    // -------------------------------------------------------------------------
    // State Access (for resync)
    // -------------------------------------------------------------------------

    /** Get all strokes (for sending to a reconnecting peer) */
    getFullState(): Stroke[] {
        return this.strokes.map(s => ({ ...s, points: [...s.points] }));
    }

    /** Replace local state with received state */
    applyFullState(strokes: Stroke[]): void {
        this.strokes = strokes.map(s => ({ ...s, points: [...s.points] }));
        this.undoStack = [];
    }

    /** Get all strokes (copy for rendering) */
    getStrokes(): Stroke[] {
        return [...this.strokes];
    }

    /** Check if history is empty */
    isEmpty(): boolean {
        return this.strokes.length === 0;
    }
}
