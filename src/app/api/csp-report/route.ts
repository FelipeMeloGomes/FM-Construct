import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("CSP Report:", JSON.stringify(body))
  } catch {
    // ignore malformed reports
  }
  return NextResponse.json({}, { status: 204 })
}
