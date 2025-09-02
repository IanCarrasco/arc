import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const berkeleyMono = localFont({
  src: [
    {
      path: '../../public/fonts/berkeley-mono/BerkeleyMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/berkeley-mono/BerkeleyMono-Bold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/berkeley-mono/BerkeleyMono-Oblique.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/berkeley-mono/BerkeleyMono-Bold-Oblique.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: "--font-berkeley-mono",
});

export const metadata: Metadata = {
  title: "ark - Academic Research Companion",
  description: "AI-powered research assistant for academic papers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${berkeleyMono.variable} antialiased`}
      >
        <Header />
        <main className="pt-0">
          {children}
        </main>
      </body>
    </html>
  );
}
