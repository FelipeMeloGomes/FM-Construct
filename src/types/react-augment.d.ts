import "react"

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const ViewTransition: any
  export function addTransitionType(type: string): void
}
