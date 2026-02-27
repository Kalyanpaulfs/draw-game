import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/lib/types";

export function usePublicRooms() {
    const [publicRooms, setPublicRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Query for waiting rooms that are public
        const q = query(
            collection(db, "rooms"),
            where("status", "==", "waiting"),
            where("config.isPublic", "==", true),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const rooms: Room[] = [];
                snapshot.forEach((doc) => {
                    rooms.push(doc.data() as Room);
                });
                setPublicRooms(rooms);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching public rooms:", err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { publicRooms, loading, error };
}
