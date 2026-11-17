import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono, Nunito_Sans, Manrope, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const manropeHeading = Manrope({subsets:['latin'],variable:'--font-heading'});

const sourceSans3 = Source_Sans_3({subsets:['latin'],variable:'--font-sans'});

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

export const viewport: Viewport = {
  themeColor: "#07070b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "KAIZEN | Academic Simulation",
  description: "The first rule-based academic engine.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo/kaizen-logo.png",
    shortcut: "/logo/kaizen-logo.png",
    apple: "/logo/kaizen-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", sourceSans3.variable, manropeHeading.variable)} suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${handwritten.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={150}>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}