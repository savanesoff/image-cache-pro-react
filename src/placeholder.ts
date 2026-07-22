import { useEffect, useState } from 'react'

/**
 * Package identifier. Present so the initial published build has a real export
 * and the toolchain (Vite lib build, `.d.ts` emit, tree-shaking) is exercised
 * end-to-end before the bindings land.
 *
 * @remarks Placeholder — remove once the real Provider/hook surface exists.
 */
export const PACKAGE_NAME = 'image-cache-pro-react'

/**
 * Smoke-test hook that reports once the component has mounted on the client.
 *
 * Exists only to prove the React + Testing Library + build pipeline is wired
 * correctly in the fresh scaffold. The real bindings (Controller/Bucket
 * providers and a `useImage`-style hook over `image-cache-pro`) replace it.
 *
 * @returns `true` after the first client-side effect has run, `false` on the
 * initial (server or pre-effect) render.
 */
export function useImageCacheProReactReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return ready
}
