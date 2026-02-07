import { doc, setDoc, getDoc, updateDoc, Timestamp, runTransaction, collection, getDocs, writeBatch, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Room, GameConfig, Player, Difficulty } from "./types";
import { generateRoomId } from "./game-utils";
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
        createdAt: Timestamp.now(),
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
            transaction.update(roomRef, { players });
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
    const playerIds = Object.keys(room.players);
    // Fisher-Yates shuffle
    for (let i = playerIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }

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
        },
    });
}

export async function nextTurn(roomId: string) {
    const roomRef = doc(db, "rooms", roomId);

    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw "Room not found";

        const room = roomSnap.data() as Room;
        if (!room.turn) throw "Game not started";

        const { playerOrder, turn, players } = room;
        const currentIndex = playerOrder.indexOf(turn.drawerId);
        let nextIndex = (currentIndex + 1) % playerOrder.length;

        // Skip disconnected players check (simple version)
        // In a real app we'd check lastSeen or isOnline, but for now we rely on the flag
        // We limit loops to avoid infinite loop
        let attempts = 0;
        while (!players[playerOrder[nextIndex]].isOnline && attempts < playerOrder.length) {
            nextIndex = (nextIndex + 1) % playerOrder.length;
            attempts++;
        }

        const nextDrawerId = playerOrder[nextIndex];

        // Check if new round
        // If we wrapped around to index 0, increment round
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
            }
        });
    });

    // Cleanup strokes from previous turn (best effort, non-blocking)
    const strokesRef = collection(db, "rooms", roomId, "draw_strokes");
    const snapshot = await getDocs(strokesRef);
    if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit().catch(console.error);
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
            "turn.candidateWords": getRandomWords(3, difficulty),
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
        });
    });
}

export async function submitGuess(roomId: string, userId: string, userName: string, text: string) {
    const roomRef = doc(db, "rooms", roomId);
    const messagesRef = collection(db, "rooms", roomId, "messages");

    // Transaction to verify and update
    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return;
        const room = roomSnap.data() as Room;

        // Validate turn state
        if (!room.turn || room.turn.phase !== "drawing") {
            // Just a chat message
            await addDoc(messagesRef, {
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

            const points = 100;
            const drawerPoints = 50;

            const currentScore = room.players[userId]?.score || 0;
            const drawerScore = room.players[room.turn.drawerId]?.score || 0;
            const newCorrectGuessers = [...(room.turn.correctGuessers || []), userId];

            const updates = {
                [`players.${userId}.score`]: currentScore + points,
                [`players.${room.turn.drawerId}.score`]: drawerScore + drawerPoints,
                "turn.correctGuessers": newCorrectGuessers
            };

            // Check for early round end
            const otherPlayers = Object.values(room.players).filter(p => p.id !== room.turn?.drawerId && p.isOnline);
            if (newCorrectGuessers.length >= otherPlayers.length) {
                // @ts-expect-error: Inferred type mismatch
                updates["turn.deadline"] = Timestamp.fromMillis(Date.now() + 3000);

                // Add immediate system message about round ending
                await addDoc(messagesRef, {
                    userId: "SYSTEM",
                    userName: "SYSTEM",
                    text: "All players guessed! Round ending in 3s...",
                    isSystem: true,
                    timestamp: Timestamp.now()
                });
            }

            transaction.update(roomRef, updates);

            await addDoc(messagesRef, {
                userId,
                userName,
                text: `${userName} guessed the word!`,
                isSystem: true,
                timestamp: Timestamp.now()
            });

        } else {
            // Wrong guess
            await addDoc(messagesRef, {
                userId,
                userName,
                text,
                isSystem: false,
                timestamp: Timestamp.now()
            });
        }
    });
}

export async function resetGame(roomId: string) {
    const roomRef = doc(db, "rooms", roomId);

    await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw "Room not found";
        const room = roomSnap.data() as Room;

        const updates = {
            status: "waiting",
            currentRound: 1,
            turn: null,
            playerOrder: [], // Will be re-shuffled on start
            createdAt: Timestamp.now(), // Reset time to sort/filter if needed
        };

        // Reset scores and ready status
        Object.keys(room.players).forEach(pid => {
            // @ts-expect-error: Inferred type mismatch
            updates[`players.${pid}.score`] = 0;
            // @ts-expect-error: Inferred type mismatch
            updates[`players.${pid}.isReady`] = false;
        });

        transaction.update(roomRef, updates);
    });

    // Cleanup all strokes
    const strokesRef = collection(db, "rooms", roomId, "draw_strokes");
    const snapshot = await getDocs(strokesRef);
    if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => batch.delete(d.ref));
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
            [`players.${userId}.isReady`]: newReadyState
        });
    });
}
