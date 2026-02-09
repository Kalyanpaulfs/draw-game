"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useUser } from "./useUser";

export type Message = {
    id: string;
    userId: string;
    userName: string;
    text: string;
    isSystem: boolean;
    timestamp: Timestamp;
    visibleTo?: string[]; // Array of userIds who can see this message
};

export function useChat(roomId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const { userId } = useUser();

    useEffect(() => {
        if (!roomId) return;

        const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];

            // Filter logic: Show if public (no visibleTo) OR explicitly visible to current user
            const visibleMessages = msgs.filter(msg =>
                !msg.visibleTo || (userId && msg.visibleTo.includes(userId))
            );

            setMessages(visibleMessages);
        });

        return () => unsubscribe();
    }, [roomId, userId]);

    return { messages };
}
