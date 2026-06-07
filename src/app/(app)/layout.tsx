import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Toaster } from "@/components/ui/sonner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
      <Toaster richColors />
    </>
  )
}
