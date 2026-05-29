import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReelKaro — AI marketing reels for Indian businesses",
  description:
    "Upload photos and your offer. ReelKaro makes a professional marketing reel with voiceover, subtitles and music in your language — in under 2 minutes.",
  manifest: "/manifest.webmanifest",
  applicationName: "ReelKaro",
  appleWebApp: { capable: true, title: "ReelKaro", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#080510",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans grain">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
