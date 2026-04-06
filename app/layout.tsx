import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// TODO(mirrorball): Replace default Next/favicon and add branded og-image when design assets are ready.
export const metadata: Metadata = {
  title: {
    default: "Mirrorball",
    template: "%s — Mirrorball",
  },
  description: "A home for the people keeping the dance floor honest.",
  openGraph: {
    title: "Mirrorball",
    description: "A home for the people keeping the dance floor honest.",
    siteName: "Mirrorball",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirrorball",
    description: "A home for the people keeping the dance floor honest.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        "h-full",
        "antialiased",
        spaceGrotesk.variable,
        inter.variable,
        jetbrainsMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
