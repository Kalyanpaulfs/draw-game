"use client";

import { Room, Player } from "@/lib/types";
import { resetGame } from "@/lib/room-actions";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

export default function GameOverView({ room }: { room: Room }) {
    const { userId } = useUser();
    const players = Object.values(room.players).sort(
        (a, b) => b.score - a.score
    );

    const winner = players[0];

    const handleReset = async () => {
        await resetGame(room.roomId);
    };

    const medal = (rank: number) => {
        if (rank === 0) return "🥇";
        if (rank === 1) return "🥈";
        if (rank === 2) return "🥉";
        return null;
    };

    return (
        <div className="game-over-root">
            {/* Background glow */}
            <div className="bg-glow" />

            {/* Layout: 3-zone flex column filling viewport */}
            <div className="layout">

                {/* ── Zone 1: Fixed top — status + winner ── */}
                <div className="top-zone">
                    <div className="match-status">
                        <span className="status-dot" />
                        <span className="status-label">Match Complete</span>
                    </div>

                    {winner && (
                        <div className="winner-hero">
                            <div className="winner-crown">👑</div>
                            <div className="winner-avatar">{winner.avatar}</div>
                            <div className="winner-info">
                                <div className="winner-name">{winner.name}</div>
                                <div className="winner-score">{winner.score} <span className="pts-label">pts</span></div>
                            </div>
                            <div className="winner-subtitle">Winner</div>
                        </div>
                    )}
                </div>

                {/* ── Zone 2: Scrollable scoreboard ── */}
                <div className="mid-zone">
                    <div className="scoreboard-card">
                        <div className="scoreboard-header">
                            <span className="scoreboard-title">Scoreboard</span>
                            <span className="scoreboard-count">{players.length} players</span>
                        </div>

                        <div className="scoreboard-list">
                            {players.map((player, index) => {
                                const isWinner = index === 0;
                                const isCurrentUser = player.id === userId;
                                return (
                                    <div
                                        key={player.id}
                                        className={`score-row ${isWinner ? "score-row--winner" : ""} ${isCurrentUser ? "score-row--you" : ""}`}
                                    >
                                        <div className="score-row-left">
                                            <span className="score-rank">
                                                {medal(index) || `#${index + 1}`}
                                            </span>
                                            <span className="score-avatar">{player.avatar}</span>
                                            <div className="score-name-wrap">
                                                <span className="score-name">{player.name}</span>
                                                {isCurrentUser && <span className="you-badge">You</span>}
                                            </div>
                                        </div>
                                        <span className="score-value">{player.score}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Zone 3: Fixed bottom — actions ── */}
                <div className="bottom-zone">
                    {room.hostId === userId ? (
                        <button onClick={handleReset} className="btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Play Again
                        </button>
                    ) : (
                        <div className="waiting-host">
                            <div className="waiting-dots">
                                <span className="dot dot-1" />
                                <span className="dot dot-2" />
                                <span className="dot dot-3" />
                            </div>
                            <span>Waiting for host</span>
                        </div>
                    )}

                    <Link href="/" className="btn-secondary">
                        ← Back to Menu
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .game-over-root {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(170deg, #0c1022 0%, #111833 40%, #0f1429 70%, #0d0f1a 100%);
                    color: #e2e8f0;
                    overflow: hidden;
                    font-family: system-ui, -apple-system, sans-serif;
                }

                .bg-glow {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background:
                        radial-gradient(ellipse 70% 50% at 50% 15%, rgba(99, 102, 241, 0.18) 0%, transparent 70%),
                        radial-gradient(ellipse 50% 45% at 80% 70%, rgba(139, 92, 246, 0.10) 0%, transparent 70%),
                        radial-gradient(ellipse 40% 35% at 20% 85%, rgba(79, 70, 229, 0.07) 0%, transparent 70%);
                }

                /* ── 3-Zone Layout ── */
                .layout {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    max-width: 440px;
                    margin: 0 auto;
                    padding: 0 16px;
                    padding-top: env(safe-area-inset-top, 0px);
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                }

                /* ── Zone 1: Top (fixed) ── */
                .top-zone {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 12px;
                }

                .match-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 14px;
                }
                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #34d399;
                    box-shadow: 0 0 8px #34d39980;
                    animation: pulse-dot 2s ease-in-out infinite;
                }
                .status-label {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.4);
                }

                .winner-hero {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    margin-bottom: 16px;
                }
                .winner-crown {
                    font-size: 24px;
                    margin-bottom: 2px;
                    animation: gentle-bounce 3s ease-in-out infinite;
                }
                .winner-avatar {
                    font-size: 48px;
                    line-height: 1;
                    filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.25));
                    margin-bottom: 6px;
                }
                .winner-info {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin-bottom: 4px;
                }
                .winner-name {
                    font-size: 18px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: #fff;
                }
                .winner-score {
                    font-size: 18px;
                    font-weight: 900;
                    letter-spacing: -0.02em;
                    background: linear-gradient(to bottom, #fbbf24, #d97706);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .pts-label {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    opacity: 0.7;
                }
                .winner-subtitle {
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: #fbbf24;
                    padding: 2px 10px;
                    border: 1px solid rgba(251, 191, 36, 0.25);
                    border-radius: 100px;
                    background: rgba(251, 191, 36, 0.08);
                }

                /* ── Zone 2: Middle (scrollable) ── */
                .mid-zone {
                    flex: 1;
                    min-height: 0; /* critical for flex overflow */
                    display: flex;
                    flex-direction: column;
                    padding-bottom: 12px;
                }

                .scoreboard-card {
                    display: flex;
                    flex-direction: column;
                    min-height: 0; /* allow shrink for overflow */
                    height: 100%;
                    background: rgba(255,255,255,0.025);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    padding: 14px;
                    padding-bottom: 10px;
                }
                .scoreboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 10px;
                    padding: 0 2px;
                    flex-shrink: 0;
                }
                .scoreboard-title {
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.4);
                }
                .scoreboard-count {
                    font-size: 11px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.2);
                }
                .scoreboard-list {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    overflow-y: auto;
                    min-height: 0;
                    flex: 1;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.08) transparent;
                }
                .scoreboard-list::-webkit-scrollbar {
                    width: 4px;
                }
                .scoreboard-list::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scoreboard-list::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.08);
                    border-radius: 4px;
                }

                /* ── Score Row ── */
                .score-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.04);
                    flex-shrink: 0;
                    transition: background 0.2s, border-color 0.2s;
                }
                .score-row:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.08);
                }
                .score-row--winner {
                    background: rgba(251, 191, 36, 0.06);
                    border-color: rgba(251, 191, 36, 0.15);
                }
                .score-row--winner:hover {
                    background: rgba(251, 191, 36, 0.09);
                    border-color: rgba(251, 191, 36, 0.22);
                }
                .score-row--you {
                    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.2);
                }
                .score-row-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }
                .score-rank {
                    width: 26px;
                    font-size: 13px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.3);
                    text-align: center;
                    flex-shrink: 0;
                }
                .score-row--winner .score-rank {
                    font-size: 15px;
                }
                .score-avatar {
                    font-size: 22px;
                    line-height: 1;
                    flex-shrink: 0;
                }
                .score-name-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                }
                .score-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.8);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .score-row--winner .score-name {
                    color: #fff;
                }
                .you-badge {
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #818cf8;
                    background: rgba(99, 102, 241, 0.12);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    padding: 1px 6px;
                    border-radius: 100px;
                    flex-shrink: 0;
                }
                .score-value {
                    font-size: 15px;
                    font-weight: 800;
                    font-variant-numeric: tabular-nums;
                    color: rgba(255,255,255,0.6);
                    flex-shrink: 0;
                    margin-left: 10px;
                }
                .score-row--winner .score-value {
                    color: #fbbf24;
                }

                /* ── Zone 3: Bottom (fixed) ── */
                .bottom-zone {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    padding: 16px 0;
                    padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
                }

                .btn-primary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    max-width: 280px;
                    padding: 13px 24px;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: #fff;
                    background: linear-gradient(135deg, #6366f1, #7c3aed);
                    border: none;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: transform 0.15s, box-shadow 0.25s;
                    box-shadow: 0 4px 24px rgba(99, 102, 241, 0.35);
                }
                .btn-primary:hover {
                    transform: scale(1.02);
                    box-shadow: 0 6px 32px rgba(99, 102, 241, 0.5);
                }
                .btn-primary:active {
                    transform: scale(0.97);
                }
                .btn-secondary {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.3);
                    text-decoration: none;
                    letter-spacing: 0.04em;
                    padding: 4px 12px;
                    border-radius: 8px;
                    transition: color 0.2s, background 0.2s;
                }
                .btn-secondary:hover {
                    color: rgba(255,255,255,0.6);
                    background: rgba(255,255,255,0.04);
                }

                .waiting-host {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 20px;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.4);
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                }
                .waiting-dots {
                    display: flex;
                    gap: 4px;
                }
                .dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.4);
                    animation: pulse-dot 1.4s ease-in-out infinite;
                }
                .dot-2 { animation-delay: 0.2s; }
                .dot-3 { animation-delay: 0.4s; }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.3); }
                }
                @keyframes gentle-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }

                /* ── Desktop ── */
                @media (min-width: 640px) {
                    .layout {
                        max-width: 480px;
                        padding: 0 24px;
                    }
                    .top-zone {
                        padding-top: 24px;
                    }
                    .winner-avatar {
                        font-size: 56px;
                    }
                    .winner-name {
                        font-size: 20px;
                    }
                    .winner-score {
                        font-size: 20px;
                    }
                    .winner-hero {
                        margin-bottom: 20px;
                    }
                    .scoreboard-card {
                        padding: 16px;
                    }
                    .score-row {
                        padding: 10px 14px;
                    }
                    .score-name {
                        font-size: 14px;
                    }
                    .score-value {
                        font-size: 16px;
                    }
                    .btn-primary {
                        padding: 14px 28px;
                        max-width: 300px;
                    }
                    .bottom-zone {
                        padding: 18px 0 24px;
                    }
                }
            `}</style>
        </div>
    );
}