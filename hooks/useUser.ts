"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const USER_ID_KEY = "draw_game_user_id";
export const USER_NAME_KEY = "draw_game_user_name";

export function useUser() {
    const [userId, setUserId] = useState<string>("");
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        let storedId = localStorage.getItem(USER_ID_KEY);
        if (!storedId) {
            storedId = uuidv4();
            localStorage.setItem(USER_ID_KEY, storedId);
        }
        setUserId(storedId);

        const storedName = localStorage.getItem(USER_NAME_KEY);
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    const saveName = (name: string) => {
        localStorage.setItem(USER_NAME_KEY, name);
        setUserName(name);
    };

    return { userId, userName, saveName };
}
