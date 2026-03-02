import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import SwipeableLayout from "@/components/SwipeableLayout";
import BottomNav from "@/components/BottomNav";
import PwaDevCleanup from "@/components/PwaDevCleanup";
import PresenceHeartbeat from "@/components/PresenceHeartbeat";
import "./globals.css";

const nunito = Nunito({ subsets: ["cyrillic", "latin"], weight: ["400", "700", "800"] });

export const metadata: Metadata = {
  title: "Наш домик",
  description: "Уютный домик для двоих",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Наш домик",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b81",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${nunito.className} antialiased transition-colors isolate`}
        style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
      >
        <ThemeProvider>
          <PwaDevCleanup />
          <PresenceHeartbeat />
          <div className="relative z-10">
            <SwipeableLayout>
              {children}
              <BottomNav />
            </SwipeableLayout>
            <Toaster position="top-center" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
