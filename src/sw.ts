import { Serwist } from "serwist"
import type { PrecacheEntry } from "serwist"
import { defaultCache } from "@serwist/turbopack/worker"

const serwist = new Serwist({
  // @ts-expect-error - __SW_MANIFEST is injected at build time by Serwist
  precacheEntries: self.__SW_MANIFEST as PrecacheEntry[],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
