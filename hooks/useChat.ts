"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useSound } from "./SoundContext";
import { SoundEvent } from "@/lib/sound-config";
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
    const { playSound } = useSound();

    const lastMessageIdRef = useRef<string | null>(null);

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

            // Trigger sounds for new messages
            const newMessages = msgs.filter(m => {
                if (!lastMessageIdRef.current) return false; // Initial load
                // Only consider messages after the last one we saw
                // Since they are ordered by timestamp, we can just check IDs
                return true;
            });

            // Improved sound trigger logic: compare with previous visible messages
            setMessages(prev => {
                const newMsgs = visibleMessages.filter(vm => !prev.find(p => p.id === vm.id));
                newMsgs.forEach(msg => {
                    if (msg.isSystem) {
                        if (msg.text.includes("guessed the word")) {
                            playSound(SoundEvent.GUESS_CORRECT);
                        } else if (msg.text.includes("close")) {
                            playSound(SoundEvent.GUESS_CLOSE);
                        }
                    }
                });
                return visibleMessages;
            });
        });

        return () => unsubscribe();
    }, [roomId, userId, playSound]);

    return { messages };
}
