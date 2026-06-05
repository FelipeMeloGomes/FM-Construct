import { createSerwistRoute } from "@serwist/turbopack"

export const { GET, generateStaticParams, dynamic, dynamicParams, revalidate } = createSerwistRoute({
  swSrc: "src/sw.ts",
})
