"use client";

import { useEffect, useState } from "react";

interface LeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function LeaveModal({ isOpen, onClose, onConfirm }: LeaveModalProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            document.body.style.overflow = "hidden";
        } else {
            const timeout = setTimeout(() => setVisible(false), 300); // Wait for transition
            document.body.style.overflow = "";
            return () => clearTimeout(timeout);
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!visible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className={`relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]">
                        <span className="text-4xl filter drop-shadow-md">👋</span>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Leave Room?</h3>
                    <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed">
                        Are you sure you want to exit? You can always rejoin using the room code if the game hasn't started.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-white/5 active:scale-[0.98]"
                        >
                            Stay
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
