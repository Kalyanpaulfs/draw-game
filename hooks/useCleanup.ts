"use client";

import { useEffect } from "react";
import { cleanupStaleRooms } from "@/lib/room-actions";

export function useCleanup() {
    useEffect(() => {
        // Run cleanup on mount
        cleanupStaleRooms();

        // Optionally run periodically if the user stays on the page a long time
        const interval = setInterval(() => {
            cleanupStaleRooms();
        }, 5 * 60 * 1000); // Every 5 minutes

        return () => clearInterval(interval);
    }, []);
}
