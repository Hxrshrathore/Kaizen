import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Nunito_Sans, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const manropeHeading = Manrope({subsets:['latin'],variable:'--font-heading'});

const nunitoSans = Nunito_Sans({subsets:['latin'],variable:'--font-sans'});

// 1. Configure Fonts with CSS variables
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

import localFont from "next/font/local";
const handwritten = localFont({
  src: "../public/fonts/comedikregularfontfrom.woff2",
  variable: "--font-handwritten",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KAIZEN | Academic Simulation",
  description: "The first rule-based academic engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", nunitoSans.variable, manropeHeading.variable)} suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${handwritten.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}