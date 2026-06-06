import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "./theme-toggle";
import ThemeTransition from "./theme-transition";
import CursorGlow from "./cursor-glow";
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
  title: "Live Q&A",
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
        {/* Global Cursor Effects */}
        <CursorGlow />

        {/* Theme Transition */}
        <ThemeTransition />

        {/* Navbar */}
        <nav className="sticky top-0 z-50 border-b border-border bg-surface/50 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
            <div>
              <h1 className="text-xl font-bold">Kealvi</h1>
            </div>

            <ThemeToggle />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}