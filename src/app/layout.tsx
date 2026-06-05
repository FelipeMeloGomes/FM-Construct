import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Sora, DM_Sans, DM_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ThemeProvider } from "@/components/theme/theme-provider"
import "./globals.css"

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
})

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "FM-Construct", template: "%s — FM-Construct" },
  description: "Sistema de gerenciamento de obra",
  manifest: "/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FM Construct",
  },
  icons: [
    { rel: "apple-touch-icon", url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    { rel: "icon", url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    { rel: "icon", url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    { rel: "mask-icon", url: "/icons/icon-maskable.svg", color: "#0a0a0a" },
  ],
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={`${sora.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}>
        <Script
          src="/theme-init.js"
          strategy="beforeInteractive"
        />
        <ThemeProvider>
          <Header />
          <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
              {children}
            </div>
          </main>
          <MobileNav />
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
