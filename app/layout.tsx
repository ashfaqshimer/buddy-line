import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import "./globals.css";

// Body / UI face: friendly geometric sans.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Codes, counts and other tabular bits.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for headings and typographic game covers.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#090a14",
};

export const metadata: Metadata = {
  title: "Buddy Line | Community Web Arcade",
  description: "Play, build, and share custom HTML/JS web games with the Buddy Line community.",
  icons: {
    icon: "/buddyline-logo.svg",
    apple: "/buddyline-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${geistMono.variable} ${unbounded.variable} h-full dark antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground">{children}</body>
    </html>
  );
}
