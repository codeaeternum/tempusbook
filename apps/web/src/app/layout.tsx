/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/components.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { AuthProvider } from "@/providers/AuthProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1117" },
  ],
};

export const metadata: Metadata = {
  title: "AeternaSuite — El ecosistema central para tu negocio de productos y servicios",
  description: "Plataforma SaaS All-In-One para 28 industrias: reservas inteligentes, formularios dinámicos, pagos, inventario, fidelización y más. Barberías, clínicas, spas, gimnasios, abogados y más.",
  keywords: ["citas", "appointments", "booking", "barbería", "spa", "médico", "dentista", "SaaS", "CRM", "ERP", "AeternaSuite"],
  authors: [{ name: "Code Aeternum" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AeternaSuite",
  },
  openGraph: {
    title: "AeternaSuite — Tu negocio, todo en un solo lugar",
    description: "Gestiona citas, clientes, pagos, formularios y más en una sola plataforma premium.",
    siteName: "AeternaSuite",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('aeternasuite-theme');
                if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <SettingsProvider>
                {children}
              </SettingsProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
