import React from 'react';

export default function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4 w-full">
                <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl text-left pointer-events-auto flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center p-6 border-b border-white/5 bg-zinc-900/80">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
