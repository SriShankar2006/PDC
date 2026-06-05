import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "./theme-toggle";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <CursorGlow />
        <nav className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto w-full max-w-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Kealvi</h1>
            </div>
            <ThemeToggle />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
