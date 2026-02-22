import React from 'react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-black selection:text-white flex flex-col items-center">
            {/* Minimalist Topbar */}
            <header className="w-full max-w-4xl px-6 py-5 flex items-center justify-between border-b border-black/5 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-black to-zinc-700 shadow-sm flex items-center justify-center">
                        <span className="text-white font-bold text-xs tracking-wider">AE</span>
                    </div>
                    <h1 className="text-lg font-medium tracking-tight text-black">Aeterna<span className="opacity-50">Suite</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-black/5 rounded-full text-black/60 hidden sm:inline-flex">Customer Hub</span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-4xl p-6 sm:p-10 flex flex-col">
                {children}
            </main>

            {/* B2C Footer */}
            <footer className="w-full max-w-4xl py-8 text-center text-xs text-black/40 border-t border-black/5">
                <p>&copy; {new Date().getFullYear()} AeternaSuite OS. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
