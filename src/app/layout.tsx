import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import SwipeableLayout from "@/components/SwipeableLayout";
import BottomNav from "@/components/BottomNav";
import PwaDevCleanup from "@/components/PwaDevCleanup";
import SectionBackgroundLayer from "@/components/SectionBackgroundLayer";
import PresenceHeartbeat from "@/components/PresenceHeartbeat";
import "./globals.css";

const nunito = Nunito({ subsets: ["cyrillic", "latin"], weight: ["400", "700", "800"] });

export const metadata: Metadata = {
  title: "Наш домик",
  description: "Компактный домик для двоих",
};

export const viewport: Viewport = {
  themeColor: "#f5eedc",
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
          <SectionBackgroundLayer />
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
