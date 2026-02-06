"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/lib/types";
import { useRouter } from "next/navigation";

export function useRoom(roomId: string) {
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!roomId) return;

        const roomRef = doc(db, "rooms", roomId);
        const unsubscribe = onSnapshot(
            roomRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setRoom(docSnap.data() as Room);
                    setLoading(false);
                    setError("");
                } else {
                    setError("Room not found");
                    setLoading(false);
                }
            },
            (err) => {
                console.error("Room listener error:", err);
                setError("Failed to sync room. Check connection.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [roomId]);

    return { room, loading, error };
}
