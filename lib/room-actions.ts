import { doc, setDoc, getDoc, updateDoc, Timestamp, runTransaction, collection, getDocs, writeBatch, addDoc, deleteField, DocumentData, query, where, deleteDoc } from "firebase/firestore";

import { db } from "./firebase";
import { Room, GameConfig, Player, Difficulty } from "./types";
import { generateRoomId, getLevenshteinDistance } from "./game-utils";
import { getRandomWords } from "./words";

export async function createRoom(hostId: string, hostName: string, config: GameConfig): Promise<string> {
    const roomId = generateRoomId();
    const roomRef = doc(db, "rooms", roomId);

    const initialPlayer: Player = {
        id: hostId,
        name: hostName,
        score: 0,
        avatar: "😊",
        isOnline: true,
        isReady: false,
        lastSeen: Timestamp.now(),
    };

    const newRoom: Room = {
        roomId,
        hostId,
        status: "waiting",
        config,
        currentRound: 1,
        turn: null,
        players: {
            [hostId]: initialPlayer,
        },
        playerOrder: [],
        usedWords: [],
        createdAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
    };

    await setDoc(roomRef, newRoom);
    return roomId;
}

export async function joinRoom(roomId: string, userId: string, userName: string): Promise<{ success: boolean; message?: string }> {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
        return { success: false, message: "Room not found" };
    }

    const roomData = roomSnap.data() as Room;

    if (roomData.players[userId]) {
        // Rejoining or already joined
        return { success: true };
    }

    if (roomData.status !== "waiting") {
        // Check if we allow late joiners? Plan said maybe block. Let's block for now as per plan edge cases.
        return { success: false, message: "Game already in progress" };
    }

    if (Object.keys(roomData.players).length >= roomData.config.maxPlayers) {
        return { success: false, message: "Room is full" };
    }

    const newPlayer: Player = {
        id: userId,
        name: userName,
        score: 0,
        avatar: "😎",
        isOnline: true,
        isReady: false,
        lastSeen: Timestamp.now(),
    };

    // Add player via transaction to prevent race conditions on full room
    try {
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(roomRef);
            if (!sfDoc.exists()) {
                throw "Document does not exist!";
            }

            const freshData = sfDoc.data() as Room;
            if (Object.keys(freshData.players).length >= freshData.config.maxPlayers) {
                throw "Room is full";
            }

            const players = { ...freshData.players, [userId]: newPlayer };
            transaction.update(roomRef, {
                players,
                lastActivityAt: Timestamp.now()
            });
        });
        return { success: true };
    } catch (e) {
        return { success: false, message: String(e) || "Failed to join" };
    }
}

export async function startGame(roomId: string) {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as Room;

    // 0. Validate everyone is ready
    const allReady = Object.values(room.players).every(p => p.isReady);
    if (!allReady) {
        throw new Error("Not all players are ready");
    }

    // 1. Shuffle players
    // 1. Sort players by join time (using stable key or index if available)
    // We want Host -> 1st Joiner -> 2nd Joiner etc.
    // room.players is an object, order is not guaranteed.
    // However, we can sort by 'joinedAt' if we had it. 
    // We don't have joinedAt, but we have `lastSeen` which is set on join.
    // For a better experience, we should probably stick to sorting by Name or simply 
    // rely on the order of keys if we want simplicity, BUT user specifically asked for join order.
    // Let's use `lastSeen` as a proxy for join time since it's set on join.
    // Better: Sort by when they were added? We don't track that explicitly.
    // Alternative: Sort alphabetically? No, user wants Sequence.
    // Correct Fix: We will assume `lastSeen` roughly equals join time for the first game.
    const playerIds = Object.keys(room.players).sort((a, b) => {
        const p1 = room.players[a];
        const p2 = room.players[b];
        return p1.lastSeen.toMillis() - p2.lastSeen.toMillis();
    });

    // 2. Set first turn
    const firstDrawerId = playerIds[0];
    const deadline = Timestamp.fromMillis(Date.now() + 15000); // 15s to choose word (initially just Phase 2 start)

    await updateDoc(roomRef, {
        status: "playing",
        playerOrder: playerIds,
        turn: {
            drawerId: firstDrawerId,
            phase: "choosing_difficulty",
            deadline,
            candidateWords: [], // Wait for difficulty selection
            secretWord: "", // Will be set in Phase 4
            correctGuessers: [],
            scores: {},
        },
        lastActivityAt: Timestamp.now(),
    });

    // Send "Starting Round 1" message
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const firstDrawerName = room.players[firstDrawerId]?.name || "Unknown";
    const messageId = `round_1_${firstDrawerId}`;

    await setDoc(doc(messagesRef, messageId), {
        userId: "SYSTEM",
        userName: "SYSTEM",
        text: `Starting Round 1: ${firstDrawerName} is drawing!`,
        isSystem: true,
        timestamp: Timestamp.now()
    });
}

export async function nextTurn(roomId: string) {
    const roomRef = doc(db, "rooms", roomId);

    let messageToSend: DocumentData | null = null;
    let msgMeta = { round: 0, drawerId: "" };

    try {
        await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef);
            if (!roomSnap.exists()) throw "Room not found";

            const room = roomSnap.data() as Room;

            if (!room.turn) throw "Game not started";

            // Prevent double-skip: If we JUST switched to choosing_difficulty and have plenty of time, ignore
            // Handle Timeout for Choosing Difficulty -> Auto-Select Difficulty
            if (room.turn.phase === "choosing_difficulty") {
                const timeLeft = room.turn.deadline.toMillis() - Date.now();
                // If >2s left, we probably just switched or haven't timed out.
                if (timeLeft > 2000) return;

                const difficulties: Difficulty[] = ["easy", "medium", "hard"];
                const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
                const deadline = Timestamp.fromMillis(Date.now() + 15000);

                transaction.update(roomRef, {
                    "turn.phase": "choosing_word",
                    "turn.difficulty": randomDifficulty,
                    "turn.candidateWords": getRandomWords(3, randomDifficulty, room.usedWords || []),
                    "turn.deadline": deadline,
                    lastActivityAt: Timestamp.now(),
                });
                return;
            }

            // Handle Timeout for Choosing Word -> Auto-Select Word
            if (room.turn.phase === "choosing_word") {
                const timeLeft = room.turn.deadline.toMillis() - Date.now();
                // If >2s left, we probably just switched or haven't timed out.
                if (timeLeft > 2000) return;

                const candidates = room.turn.candidateWords || [];
                if (candidates.length > 0) {
                    const randomWord = candidates[Math.floor(Math.random() * candidates.length)];
                    const deadline = Timestamp.fromMillis(Date.now() + 60000);

                    // Generate hint indices
                    const hintIndices = Array.from({ length: randomWord.length }, (_, i) => i).sort(() => Math.random() - 0.5);

                    transaction.update(roomRef, {
                        "turn.phase": "drawing",
                        "turn.secretWord": randomWord,
                        "turn.deadline": deadline,
                        "turn.candidateWords": [],
                        "turn.correctGuessers": [],
                        "turn.scores": {},
                        "turn.hintIndices": hintIndices,
                        usedWords: [...(room.usedWords || []), randomWord],
                        lastActivityAt: Timestamp.now(),
                    });
                    return;
                }
            }

            // NEW: Transition to Revealing Phase if currently Drawing
            if (room.turn.phase === "drawing") {
                const timeLeft = room.turn.deadline.toMillis() - Date.now();
                // If there IS significant time left (>2s), assume we just switched phases or are still playing.
                // Exception: If everyone guessed, deadline is 0, so timeLeft < 0, so proceed!
                if (timeLeft > 2000) return;

                const revealDeadline = Timestamp.fromMillis(Date.now() + 3000); // 3s reveal
                transaction.update(roomRef, {
                    "turn.phase": "revealing",
                    "turn.deadline": revealDeadline,
                    lastActivityAt: Timestamp.now(),
                });
                return;
            }

            // If we are in 'revealing' phase (or others), we proceed to next player
            // Prevent skipping revealing phase if it's still active
            if (room.turn.phase === "revealing") {
                const timeLeft = room.turn.deadline.toMillis() - Date.now();
                // If there's still time left (allow 1s buffer for network latency/processing), don't skip
                if (timeLeft > 500) {
                    return;
                }
            }

            const { playerOrder, turn, players } = room;
            const currentIndex = playerOrder.indexOf(turn.drawerId);
            let nextIndex = (currentIndex + 1) % playerOrder.length;

            // Skip disconnected players check (simple version)
            let attempts = 0;
            while (!players[playerOrder[nextIndex]].isOnline && attempts < playerOrder.length) {
                nextIndex = (nextIndex + 1) % playerOrder.length;
                attempts++;
            }

            const nextDrawerId = playerOrder[nextIndex];

            // Check if new round
            let nextRound = room.currentRound;
            if (nextIndex === 0) {
                nextRound++;
            }

            if (nextRound > room.config.rounds) {
                transaction.update(roomRef, { status: "finished", turn: null });
                return;
            }

            const deadline = Timestamp.fromMillis(Date.now() + 15000); // 15s to choose

            transaction.update(roomRef, {
                currentRound: nextRound,
                turn: {
                    drawerId: nextDrawerId,
                    phase: "choosing_difficulty",
                    deadline,
                    candidateWords: [],
                    secretWord: "",
                    correctGuessers: [],
                    scores: {},
                },
                lastActivityAt: Timestamp.now(),
            });

            // Set message metadata for deterministic ID
            const drawerName = players[nextDrawerId]?.name || "Unknown";
            msgMeta = { round: nextRound, drawerId: nextDrawerId };

            messageToSend = {
                userId: "SYSTEM",
                userName: "SYSTEM",
                text: `Starting Round ${nextRound}: ${drawerName} is drawing!`,
                isSystem: true,
                timestamp: Timestamp.now()
            };
        });

        // Send message if set
        // Send message with deterministic ID
        if (messageToSend && msgMeta.round > 0) {
            const messagesRef = collection(db, "rooms", roomId, "messages");
            const msgId = `round_${msgMeta.round}_${msgMeta.drawerId}`;
            await setDoc(doc(messagesRef, msgId), messageToSend);
        }
    } catch (e: unknown) {
        const error = e as { code?: string; message?: string };
        // If precondition failed, it means the document changed under us (likely another client triggered nextTurn).
        // This is expected in a distributed system with optimistic UI. We can safely ignore it if the outcome
        // is what we wanted (turn advanced), or just log it as a non-fatal warning.
        if (error.code === 'failed-precondition' || error.code === 'aborted') {
            console.warn("nextTurn transaction contention (likely harmless race condition):", error.message);
            return;
        }
        throw e;
    }

}

export async function selectDifficulty(roomId: string, difficulty: Difficulty) {
    const roomRef = doc(db, "rooms", roomId);

    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw "Room not found";

        const room = roomSnap.data() as Room;
        if (!room.turn || room.turn.phase !== "choosing_difficulty") throw "Not choosing difficulty phase";

        const deadline = Timestamp.fromMillis(Date.now() + 15000); // 15s to pick word

        transaction.update(roomRef, {
            "turn.phase": "choosing_word",
            "turn.difficulty": difficulty,
            "turn.candidateWords": getRandomWords(3, difficulty, room.usedWords || []),
            "turn.deadline": deadline,
        });
    });
}

export async function selectWord(roomId: string, word: string) {
    const roomRef = doc(db, "rooms", roomId);

    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw "Room not found";

        const room = roomSnap.data() as Room;
        if (!room.turn || room.turn.phase !== "choosing_word") throw "Not choosing word phase";

        // Validate word is a candidate
        if (!room.turn.candidateWords.includes(word)) {
            throw "Invalid word choice";
        }

        const deadline = Timestamp.fromMillis(Date.now() + 60000); // 60s to draw

        transaction.update(roomRef, {
            "turn.phase": "drawing",
            "turn.secretWord": word,
            "turn.deadline": deadline,
            "turn.candidateWords": [], // Clear candidates to hide them
            "turn.correctGuessers": [],
            "turn.scores": {},
            "turn.hintIndices": Array.from({ length: word.length }, (_, i) => i).sort(() => Math.random() - 0.5),
            usedWords: [...(room.usedWords || []), word],
        });
    });
}

export async function submitGuess(roomId: string, userId: string, userName: string, text: string) {
    const roomRef = doc(db, "rooms", roomId);
    const messagesRef = collection(db, "rooms", roomId, "messages");

    let messagesToSend: DocumentData[] = [];

    try {
        await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef);
            if (!roomSnap.exists()) return;
            const room = roomSnap.data() as Room;

            messagesToSend = []; // Reset on retry

            // Validate turn state
            if (!room.turn || room.turn.phase !== "drawing") {
                // Just a chat message
                messagesToSend.push({
                    userId,
                    userName,
                    text,
                    isSystem: false,
                    timestamp: Timestamp.now()
                });
                return;
            }

            const secret = room.turn.secretWord.toLowerCase();
            const guess = text.trim().toLowerCase();



            if (secret === guess) {
                // Correct Guess!
                if (room.turn.correctGuessers?.includes(userId)) return;

                // Scoring Logic
                const now = Date.now();
                const deadline = room.turn.deadline.toMillis();
                const totalDuration = 60 * 1000;

                const timeLeft = Math.max(0, deadline - now);
                const timeRatio = Math.min(1, Math.max(0, timeLeft / totalDuration));

                const points = Math.round(50 + (timeRatio * 50));

                // Drawer Score
                const totalPlayers = Object.keys(room.players).length;
                const potentialGuessers = Math.max(1, totalPlayers - 1);

                const newCorrectGuessers = [...(room.turn.correctGuessers || []), userId];

                const drawerIncrement = Math.round((1 / potentialGuessers) * 100);

                const currentScore = room.players[userId]?.score || 0;
                const drawerScore = room.players[room.turn.drawerId]?.score || 0;

                const updates: Record<string, string | number | string[] | Timestamp | Record<string, number>> = {
                    [`players.${userId}.score`]: currentScore + points,
                    [`players.${room.turn.drawerId}.score`]: drawerScore + drawerIncrement,
                    "turn.correctGuessers": newCorrectGuessers,
                    [`turn.scores.${userId}`]: points
                };

                // Check for early round end
                const otherPlayers = Object.values(room.players).filter(p => p.id !== room.turn?.drawerId && p.isOnline);

                messagesToSend.push({
                    userId,
                    userName,
                    text: `${userName} guessed the word!`,
                    isSystem: true,
                    timestamp: Timestamp.now()
                });

                if (newCorrectGuessers.length >= otherPlayers.length) {
                    // Force immediate expiration
                    updates["turn.deadline"] = Timestamp.fromMillis(0);

                    messagesToSend.push({
                        userId: "SYSTEM",
                        userName: "SYSTEM",
                        text: "All players guessed! Round ending...",
                        isSystem: true,
                        // Add 1ms offset to ensure it follows the individual guess message
                        timestamp: Timestamp.fromMillis(Date.now() + 1)
                    });
                }

                updates.lastActivityAt = Timestamp.now();
                transaction.update(roomRef, updates);

            } else {
                // Wrong guess
                const distance = getLevenshteinDistance(secret, guess);
                const len = secret.length;
                let threshold = 0;

                if (len < 5) threshold = 1;
                else if (len <= 7) threshold = 2;
                else threshold = 3;

                if (distance <= threshold && distance > 0) {
                    messagesToSend.push({
                        userId: "SYSTEM",
                        userName: "SYSTEM",
                        text: `You are very close!`,
                        isSystem: true,
                        timestamp: Timestamp.now(),
                        visibleTo: [userId]
                    });

                    messagesToSend.push({
                        userId,
                        userName,
                        text,
                        isSystem: false,
                        timestamp: Timestamp.now(),
                        visibleTo: [userId]
                    });
                } else {
                    messagesToSend.push({
                        userId,
                        userName,
                        text,
                        isSystem: false,
                        timestamp: Timestamp.now()
                    });
                }
            }
        }); // End runTransaction

        // Execution successful, send messages sequentially to preserve order
        if (messagesToSend.length > 0) {
            for (const msg of messagesToSend) {
                await addDoc(messagesRef, msg);
            }
        }

    } catch (e) {
        console.error("submitGuess transaction failed:", e);
        throw e; // Re-throw to let UI handle it
    }
}

export async function resetGame(roomId: string) {
    const roomRef = doc(db, "rooms", roomId);

    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw "Room not found";
        const room = roomSnap.data() as Room;

        const updates: Record<string, string | number | boolean | null | string[] | Timestamp> = {
            status: "waiting",
            currentRound: 1,
            turn: null,
            playerOrder: [], // Will be re-shuffled on start
            usedWords: [],
            createdAt: Timestamp.now(), // Reset time to sort/filter if needed
        };

        // Reset scores and ready status
        Object.keys(room.players).forEach(pid => {
            updates[`players.${pid}.score`] = 0;
            updates[`players.${pid}.isReady`] = false;
        });

        updates.lastActivityAt = Timestamp.now();
        transaction.update(roomRef, updates);
    });

    // Clear chat messages (non-blocking)
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const messagesSnap = await getDocs(messagesRef);
    if (!messagesSnap.empty) {
        const batch = writeBatch(db);
        messagesSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit().catch(console.error);
    }

}

export async function toggleReady(roomId: string, userId: string) {
    const roomRef = doc(db, "rooms", roomId);

    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw "Room not found";

        const room = roomSnap.data() as Room;
        const player = room.players[userId];
        if (!player) throw "Player not found";

        const newReadyState = !player.isReady;

        transaction.update(roomRef, {
            [`players.${userId}.isReady`]: newReadyState,
            lastActivityAt: Timestamp.now()
        });
    });
}

export async function leaveRoom(roomId: string, userId: string) {
    const roomRef = doc(db, "rooms", roomId);
    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return;

        const room = roomSnap.data() as Room;
        const remainingPlayers = Object.keys(room.players).filter(id => id !== userId);

        if (remainingPlayers.length === 0) {
            transaction.delete(roomRef);
        } else {
            const updates: Record<string, string | DocumentData | ReturnType<typeof deleteField> | Timestamp> = {
                [`players.${userId}`]: deleteField()
            };

            if (room.hostId === userId) {
                updates.hostId = remainingPlayers[0];
            }
            // If user was ready, maybe we don't need to do anything else, logic handles it.

            updates.lastActivityAt = Timestamp.now();
            transaction.update(roomRef, updates);
        }
    });
}

export async function kickPlayer(roomId: string, targetUserId: string, hostId: string) {
    const roomRef = doc(db, "rooms", roomId);
    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw new Error("Room not found");

        const room = roomSnap.data() as Room;

        // Validation: Only host can kick
        if (room.hostId !== hostId) {
            throw new Error("Only the host can kick players");
        }

        // Validation: Host cannot kick themselves
        if (targetUserId === hostId) {
            throw new Error("You cannot kick yourself");
        }

        if (!room.players[targetUserId]) return; // Player already gone

        const updates: Record<string, ReturnType<typeof deleteField>> = {
            [`players.${targetUserId}`]: deleteField()
        };

        // If game is in progress, we might need more cleanup, but as per plan, 
        // this is primarily for the lobby.
        transaction.update(roomRef, updates);
    });
}

export async function updateRoomConfig(roomId: string, config: Partial<GameConfig>, requesterId: string) {
    const roomRef = doc(db, "rooms", roomId);
    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw new Error("Room not found");

        const room = roomSnap.data() as Room;
        if (room.hostId !== requesterId) {
            throw new Error("Only the host can update room settings");
        }

        const newConfig = { ...room.config, ...config };

        // Basic validation
        if (newConfig.maxPlayers < 2) newConfig.maxPlayers = 2;
        if (newConfig.maxPlayers > 12) newConfig.maxPlayers = 12;
        if (newConfig.rounds < 1) newConfig.rounds = 1;
        if (newConfig.rounds > 10) newConfig.rounds = 10;

        transaction.update(roomRef, {
            config: newConfig,
            lastActivityAt: Timestamp.now()
        });
    });
}

export async function cleanupStaleRooms() {
    try {
        const now = Date.now();
        const thirtyMinutesAgo = Timestamp.fromMillis(now - 30 * 60 * 1000);
        const twoHoursAgo = Timestamp.fromMillis(now - 2 * 60 * 1000 * 60);

        const roomsRef = collection(db, "rooms");

        // Single query on createdAt to avoid composite index requirement.
        // We fetch everything older than 30 mins and filter the rest in memory.
        const cleanupQuery = query(
            roomsRef,
            where("createdAt", "<", thirtyMinutesAgo)
        );

        const querySnap = await getDocs(cleanupQuery);
        const roomIdsToDelete = new Set<string>();

        querySnap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const activity = data.lastActivityAt || data.createdAt;
            const status = data.status;
            const activityMillis = activity.toMillis();

            // 1. Delete if finished and idle for 30 mins
            if (status === "finished" && activityMillis < thirtyMinutesAgo.toMillis()) {
                roomIdsToDelete.add(docSnap.id);
            }
            // 2. Delete if any room is idle for 2 hours
            else if (activityMillis < twoHoursAgo.toMillis()) {
                roomIdsToDelete.add(docSnap.id);
            }
        });

        if (roomIdsToDelete.size === 0) return;

        console.log(`Cleaning up ${roomIdsToDelete.size} stale/legacy rooms...`);

        for (const roomId of roomIdsToDelete) {
            // 1. Delete messages subcollection
            const messagesRef = collection(db, "rooms", roomId, "messages");
            const messagesSnap = await getDocs(messagesRef);
            if (!messagesSnap.empty) {
                const batch = writeBatch(db);
                messagesSnap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }

            // 2. Delete the room document
            await deleteDoc(doc(db, "rooms", roomId));
        }

        console.log("Cleanup complete.");
    } catch (error) {
        console.error("Cleanup error:", error);
    }
}
