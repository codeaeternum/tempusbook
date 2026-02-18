import type { Metadata } from "next";
import "./globals.css";
import "../styles/components.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";

export const metadata: Metadata = {
  title: "TempusBook — Gestión de citas para tu negocio",
  description: "Plataforma SaaS multi-categoría para gestión de citas, clientes, pagos y más. Barberías, consultorios, spas, dentistas y más.",
  keywords: ["citas", "appointments", "booking", "barbería", "spa", "médico", "dentista", "SaaS"],
  authors: [{ name: "TempusBook" }],
  openGraph: {
    title: "TempusBook — Tu negocio, tus citas, todo en un solo lugar",
    description: "Gestiona citas, clientes, pagos y más en una sola plataforma moderna.",
    siteName: "TempusBook",
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
      </head>
      <body>
        <ThemeProvider>
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
