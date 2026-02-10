"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { SoundEvent } from '@/lib/sound-config';

interface SoundContextType {
    playSound: (event: SoundEvent) => void;
    volume: number;
    setVolume: (volume: number) => void;
    isMuted: boolean;
    setIsMuted: (isMuted: boolean) => void;
    toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [volume, setVolumeState] = useState(0.5);
    const [isMuted, setIsMutedState] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Persist settings
    useEffect(() => {
        const savedVolume = localStorage.getItem('sound_volume');
        const savedMuted = localStorage.getItem('sound_muted');
        if (savedVolume) setVolumeState(parseFloat(savedVolume));
        if (savedMuted) setIsMutedState(savedMuted === 'true');
    }, []);

    const setVolume = (v: number) => {
        setVolumeState(v);
        localStorage.setItem('sound_volume', v.toString());
    };

    const setIsMuted = (m: boolean) => {
        setIsMutedState(m);
        localStorage.setItem('sound_muted', m.toString());
    };

    const toggleMute = () => setIsMuted(!isMuted);

    // Synthetic Sound Engine
    const playSyntheticSound = useCallback((event: SoundEvent) => {
        if (isMuted) return;

        if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtx();
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.5, now);
        masterGain.connect(ctx.destination);

        const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + delay);

            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(1, now + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now + delay);
            osc.stop(now + delay + duration);
        };

        switch (event) {
            case SoundEvent.CLICK_SOFT:
                playTone(800, 'sine', 0.1);
                break;
            case SoundEvent.PLAYER_JOIN:
                playTone(400, 'sine', 0.2);
                playTone(600, 'sine', 0.2, 0.05);
                break;
            case SoundEvent.PLAYER_LEAVE:
                playTone(600, 'sine', 0.2);
                playTone(400, 'sine', 0.2, 0.05);
                break;
            case SoundEvent.PLAYER_READY:
                playTone(500, 'sine', 0.1);
                playTone(1000, 'sine', 0.2, 0.05);
                break;
            case SoundEvent.PLAYER_UNREADY:
                playTone(1000, 'sine', 0.05);
                playTone(500, 'sine', 0.1, 0.05);
                break;
            case SoundEvent.GUESS_CORRECT:
                playTone(523.25, 'sine', 0.3); // C5
                playTone(659.25, 'sine', 0.3, 0.1); // E5
                playTone(783.99, 'sine', 0.4, 0.2); // G5
                break;
            case SoundEvent.GUESS_CLOSE:
                playTone(440, 'sine', 0.1);
                playTone(440, 'sine', 0.1, 0.15);
                break;
            case SoundEvent.TIMER_WARNING:
                playTone(200, 'triangle', 0.1);
                break;
            case SoundEvent.GAME_START:
                playTone(300, 'sine', 0.2);
                playTone(400, 'sine', 0.2, 0.1);
                playTone(500, 'sine', 0.4, 0.2);
                break;
            case SoundEvent.DRAWER_SELECTED:
                playTone(440, 'sine', 0.1);
                playTone(880, 'sine', 0.2, 0.05);
                break;
            case SoundEvent.PHASE_CHOOSING_WORD:
            case SoundEvent.PHASE_DRAWING:
                playTone(600, 'sine', 0.1);
                break;
            case SoundEvent.DIFFICULTY_SELECTED:
                playTone(600, 'sine', 0.1);
                playTone(800, 'sine', 0.1, 0.1);
                break;
            case SoundEvent.SETTINGS_CHANGE:
                playTone(800, 'sine', 0.05);
                playTone(1000, 'sine', 0.05, 0.05);
                break;
            case SoundEvent.WORD_CHOSEN:
                playTone(600, 'sine', 0.1);
                playTone(900, 'sine', 0.1, 0.1);
                playTone(1200, 'sine', 0.2, 0.2);
                break;
            case SoundEvent.ROUND_END:
                playTone(400, 'sine', 0.3);
                playTone(300, 'sine', 0.5, 0.1);
                break;
            case SoundEvent.GAME_OVER:
                playTone(500, 'sine', 0.2);
                playTone(400, 'sine', 0.2, 0.2);
                playTone(300, 'sine', 0.6, 0.4);
                break;
            case SoundEvent.WINNER:
                [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                    playTone(f, 'sine', 0.4, i * 0.1);
                });
                break;
            case SoundEvent.ERROR:
                playTone(150, 'sawtooth', 0.2);
                break;
            default:
                playTone(440, 'sine', 0.1);
        }
    }, [isMuted, volume]);

    // Unlock audio on first interaction
    useEffect(() => {
        const unlock = () => {
            if (!audioContextRef.current) {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioCtx();
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };
    }, []);

    return (
        <SoundContext.Provider value={{ playSound: playSyntheticSound, volume, setVolume, isMuted, setIsMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
}
