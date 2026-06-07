"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    SwaggerUIBundle: {
      (config: {
        url: string
        dom_id: string
        presets: unknown[]
        layout: string
        supportedSubmitMethods: string[]
        deepLinking: boolean
      }): void
      presets: {
        apis: unknown
      }
    }
  }
}

export default function APIDocsPage() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const linkEl = document.createElement("link")
    linkEl.rel = "stylesheet"
    linkEl.href = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
    document.head.appendChild(linkEl)

    const scriptEl = document.createElement("script")
    scriptEl.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
    scriptEl.async = true
    scriptEl.onload = () => {
      window.SwaggerUIBundle({
        url: "/api/docs",
        dom_id: "#swagger-ui",
        presets: [window.SwaggerUIBundle.presets.apis as never],
        layout: "BaseLayout",
        supportedSubmitMethods: [],
        deepLinking: true,
      })
    }
    document.body.appendChild(scriptEl)

    return () => {
      linkEl.remove()
      scriptEl.remove()
    }
  }, [])

  return (
    <div className="h-dvh w-full">
      <div id="swagger-ui" ref={ref} />
    </div>
  )
}
