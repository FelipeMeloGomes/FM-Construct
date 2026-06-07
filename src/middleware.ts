import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV === "development"

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' https://vercel.live https://cdn.jsdelivr.net${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://vercel.live`,
    `frame-ancestors 'none'`,
    `report-to csp-endpoint`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `frame-src 'none'`,
  ].join("; ")

  function htmlResponse() {
    const res = NextResponse.next()
    res.headers.set("Content-Security-Policy", csp)
    res.headers.set(
      "Report-To",
      '{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"/api/csp-report"}]}'
    )
    return res
  }

  if (pathname === "/login") {
    const token = request.cookies.get("fm_auth")?.value
    if (token && (await verifyToken(token))) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return htmlResponse()
  }

  if (pathname === "/theme-init.js" || pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname.startsWith("/api/csp-report") || pathname === "/api/docs" || pathname === "/docs") {
    return htmlResponse()
  }

  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("fm_auth")?.value
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return htmlResponse()
  }

  const token = request.cookies.get("fm_auth")?.value

  if (!token || !(await verifyToken(token))) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return htmlResponse()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
