import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Quran AI",
  description: "Al-Quran Daily Reading Tracker with AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased bg-gray-100`}>
        <div className="max-w-[390px] mx-auto min-h-screen bg-background relative">
          {children}
        </div>
      </body>
    </html>
  );
}
