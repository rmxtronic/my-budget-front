import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Budget",
  description: "Gestiona tu presupuesto personal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <div className="bg-animated" style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
            {/* Background orbs */}
            <div className="orb" style={{ width: 500, height: 500, background: "#7c3aed", top: -100, left: -150 }} />
            <div className="orb" style={{ width: 400, height: 400, background: "#2563eb", bottom: 100, right: -100 }} />
            <div className="orb" style={{ width: 300, height: 300, background: "#ec4899", top: "40%", right: "20%" }} />

            <main style={{ position: "relative", zIndex: 10 }}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
