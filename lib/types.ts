import { Timestamp } from "firebase/firestore";

export type Player = {
    id: string;
    name: string;
    score: number;
    avatar: string; // URL or emoji or index
    isOnline: boolean;
    lastSeen: Timestamp;
};

export type GameStatus = "waiting" | "playing" | "finished";

export type GameConfig = {
    maxPlayers: number;
    rounds: number;
    isPublic: boolean;
};

export type TurnState = {
    drawerId: string;
    phase: "choosing" | "drawing" | "revealing";
    deadline: Timestamp;
    candidateWords: string[];
    secretWord: string;
    correctGuessers: string[];
};

export type Room = {
    roomId: string; // Document ID
    hostId: string;
    status: GameStatus;
    config: GameConfig;
    currentRound: number;
    turn: TurnState | null;
    players: Record<string, Player>;
    playerOrder: string[];
    createdAt: Timestamp;
};
