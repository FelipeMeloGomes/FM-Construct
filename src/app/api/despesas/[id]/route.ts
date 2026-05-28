/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server"
export const dynamic = "force-dynamic"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()
  const [despesa] = await db`SELECT * FROM despesas WHERE id = ${id}`
  if (!despesa) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  return Response.json(despesa)
}
