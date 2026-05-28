import type { Metadata } from "next"
import { Sora, DM_Sans, DM_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { PageAnimation } from "@/components/layout/page-animation"
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
  title: "FM-Construct",
  description: "Sistema de gerenciamento de obra",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${sora.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}>
        <ThemeProvider>
          <Header />
          <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
              <PageAnimation>
                {children}
              </PageAnimation>
            </div>
          </main>
          <MobileNav />
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
