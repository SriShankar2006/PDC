import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeTransition from "./theme-transition";
import CursorGlow from "./cursor-glow";
import CelestialBg from "./celestial-bg";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kealvi — Live Q&A",
  description: "Ask and vote on questions, create and answer polls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <CursorGlow />
        <ThemeTransition />
        <CelestialBg />
        <main className="flex-1 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
