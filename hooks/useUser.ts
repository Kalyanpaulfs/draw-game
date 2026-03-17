"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

export const USER_NAME_KEY = "draw_game_user_name";

export function useUser() {
    const [userId, setUserId] = useState<string>("");
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        // 1. Handle Anonymous Auth
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    const userCredential = await signInAnonymously(auth);
                    setUserId(userCredential.user.uid);
                } catch (error) {
                    console.error("Error signing in anonymously:", error);
                }
            }
        });

        // 2. Handle Display Name
        const storedName = localStorage.getItem(USER_NAME_KEY);
        if (storedName) {
            setUserName(storedName);
        }

        return () => unsubscribe();
    }, []);

    const saveName = (name: string) => {
        localStorage.setItem(USER_NAME_KEY, name);
        setUserName(name);
    };

    return { userId, userName, saveName };
}
