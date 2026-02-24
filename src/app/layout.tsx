import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import SwipeableLayout from "@/components/SwipeableLayout";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const nunito = Nunito({ subsets: ["cyrillic", "latin"], weight: ["400", "700", "800"] });

export const metadata: Metadata = {
  title: "Наш домик",
  description: "Компактный домик для двоих",
};

export const viewport: Viewport = {
  themeColor: "#f5eedc",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${nunito.className} antialiased bg-[#f2ebe3] dark:bg-[#1a1614] text-[#4a403b] dark:text-[#d4c8c1]`}>
        <ThemeProvider>
          <SwipeableLayout>
            {children}
            <BottomNav />
          </SwipeableLayout>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
