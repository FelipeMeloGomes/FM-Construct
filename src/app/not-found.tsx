import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold text-primary">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Página não encontrada</p>
      <Link href="/" className="btn-glow mt-6 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 cursor-pointer">
        Voltar ao início
      </Link>
    </div>
  )
}
