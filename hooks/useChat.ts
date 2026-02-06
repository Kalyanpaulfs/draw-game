"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Message = {
    id: string;
    userId: string;
    userName: string;
    text: string;
    isSystem: boolean;
    timestamp: Timestamp;
};

export function useChat(roomId: string) {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (!roomId) return;

        const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [roomId]);

    return { messages };
}
