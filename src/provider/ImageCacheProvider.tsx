import { Controller, type ControllerProps } from 'image-cache-pro'
import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import { ImageCacheContext } from './ImageCacheContext'

export type ImageCacheProviderProps = ControllerProps & {
  children?: ReactNode
  /**
   * Imperative escape hatch: called with the Controller once it exists (and
   * again if it is recreated). Useful for wiring an input layer that lives
   * outside the React tree.
   */
  onController?: (controller: Controller) => void
}

/**
 * Owns one image-cache-pro `Controller` for the subtree.
 *
 * - Created in an effect → SSR-safe (no engine on the server) and
 *   StrictMode-safe (the double-invoked effect creates a fresh instance
 *   after the teardown clear).
 * - Construction options are initial-only, EXCEPT the live-tunable ones:
 *   `ram`, `video` (runtime budget setters) and `canRender` (the consumer-
 *   owned input gate) are kept in sync when their props change.
 * - `controller.clear()` on unmount — deterministic teardown, no leaks.
 */
export const ImageCacheProvider = memo(function ImageCacheProvider({
  children,
  onController,
  ...options
}: ImageCacheProviderProps) {
  const [controller, setController] = useState<Controller | null>(null)
  // construction snapshot: changing non-live options later must not trash
  // the cache by recreating the engine
  const initialOptionsRef = useRef(options)
  const onControllerRef = useRef(onController)

  useEffect(() => {
    onControllerRef.current = onController
  })

  useEffect(() => {
    const instance = new Controller(initialOptionsRef.current)
    setController(instance)
    onControllerRef.current?.(instance)

    return () => {
      instance.clear()
    }
  }, [])

  // live-tunable: input gate
  const { canRender, ram, video } = options

  useEffect(() => {
    if (controller && canRender) {
      controller.canRender = canRender
    }
  }, [controller, canRender])

  // live-tunable: memory budgets (e.g. shrink while media plays)
  useEffect(() => {
    if (controller && ram !== undefined && ram !== controller.ram.size) {
      controller.setRamBudget(ram)
    }
  }, [controller, ram])

  useEffect(() => {
    if (controller && video !== undefined && video !== controller.video.size) {
      controller.setVideoBudget(video)
    }
  }, [controller, video])

  return (
    <ImageCacheContext.Provider value={controller}>
      {children}
    </ImageCacheContext.Provider>
  )
})
