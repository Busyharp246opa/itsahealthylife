import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./focus-circle.css";
import "./weekly-training.css";
import { SessionPolicy } from "./components/session-policy";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://127.0.0.1:3390"),
  title: { default: "It’s A Healthy Life", template: "%s · It’s A Healthy Life" },
  description: "Plan workouts, train with coaches, track wellness, and stay accountable with your circle on a local Supabase stack.",
  applicationName: "It’s A Healthy Life",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand/healthy-life-mark.png" },
  openGraph: {
    title: "It’s A Healthy Life",
    description: "Workouts, coaching, wellness, and community in one place.",
    type: "website",
    images: [{ url: "/og-healthy-life.png", width: 1200, height: 630, alt: "It’s A Healthy Life" }],
  },
  twitter: { card: "summary_large_image", title: "It’s A Healthy Life", description: "Move, nourish, connect, and grow.", images: ["/og-healthy-life.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}><body className="antialiased"><SessionPolicy />{children}</body></html>;
}
