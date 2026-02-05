import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EventHire - Find Event Jobs",
  description: "Connect event organizers with helpers for weddings, parties, and corporate events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50`}
      >
        {children}
      </body>
    </html>
  );
}