import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialPilot — Social Media Management",
  description:
    "Schedule posts, track analytics, and grow your audience across every social platform with SocialPilot.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
