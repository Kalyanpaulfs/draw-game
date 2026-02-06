"use client";

import { useEffect, useState } from "react";
import { Room } from "@/lib/types";
import { nextTurn } from "@/lib/room-actions";

export function useGameLoop(room: Room | null, userId: string) {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!room || room.status !== "playing" || !room.turn) {
            // eslint-disable-next-line
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            if (!room.turn?.deadline) return;

            const deadlineMillis = room.turn.deadline.toMillis();
            const now = Date.now();
            const diff = Math.ceil((deadlineMillis - now) / 1000);

            setTimeLeft(diff > 0 ? diff : 0);

            // Host handles turn switching when time expires
            if (diff <= 0 && room.hostId === userId) {
                nextTurn(room.roomId).catch(console.error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [room, userId]);

    return { timeLeft };
}
