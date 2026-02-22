'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Zap, ArrowRight, X } from 'lucide-react';

interface PaywallState {
    show: boolean;
    message: string;
    requiredPlan: string;
    currentPlan: string;
}

export function PaywallModal() {
    const router = useRouter();
    const [state, setState] = useState<PaywallState>({
        show: false,
        message: '',
        requiredPlan: '',
        currentPlan: ''
    });

    useEffect(() => {
        const handlePaywallEvent = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail) {
                setState({
                    show: true,
                    message: customEvent.detail.message,
                    requiredPlan: customEvent.detail.requiredPlan,
                    currentPlan: customEvent.detail.currentPlan
                });
            }
        };

        window.addEventListener('aeterna-paywall', handlePaywallEvent);
        return () => window.removeEventListener('aeterna-paywall', handlePaywallEvent);
    }, []);

    if (!state.show) return null;

    const closeModal = () => {
        setState(prev => ({ ...prev, show: false }));
    };

    const navigateToBilling = () => {
        closeModal();
        router.push('/dashboard/settings/billing');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Blurry Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={closeModal}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header SVG/Icon Area */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 text-center border-b border-indigo-100">
                    <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-4 relative">
                        <Lock className="w-8 h-8 text-indigo-600" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Actualiza tu Plan</h2>
                    <p className="text-indigo-600 font-semibold mt-1">Has alcanzado un límite en tu plan actual</p>
                </div>

                {/* Body Area */}
                <div className="p-8">
                    <p className="text-gray-600 text-center text-lg mb-6 leading-relaxed">
                        {state.message}
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-8 flex justify-between items-center text-sm font-medium">
                        <div className="text-gray-500">
                            Tu plan: <span className="text-gray-900 ml-1">{state.currentPlan}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="text-indigo-600">
                            Requerido: <span className="ml-1 font-bold">{state.requiredPlan}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={navigateToBilling}
                            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-transform hover:-translate-y-1 hover:shadow-lg"
                        >
                            Ver Planes y Precios <Zap className="w-5 h-5" fill="currentColor" />
                        </button>
                        <button
                            onClick={closeModal}
                            className="w-full bg-white text-gray-500 hover:text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors"
                        >
                            En otro momento
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
