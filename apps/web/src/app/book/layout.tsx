export const metadata = {
    title: 'Reservar Cita',
    description: 'Proceso de reserva rápido y seguro',
};

export default function BookLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <main className="flex-grow">
                {children}
            </main>

            <footer className="w-full py-6 text-center text-sm text-gray-400 mt-auto bg-white border-t border-gray-100">
                <p>Potenciado por <b>AeternaSuite</b></p>
            </footer>
        </div>
    );
}
