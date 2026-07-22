import { nextFrame } from 'image-cache-pro'
import { useEffect, useRef, useState } from 'react'

/**
 * Subscribes to a bursty external source and re-renders AT MOST once per
 * animation frame with the latest snapshot. On low-power devices (STB/TV)
 * per-event re-renders are the difference between smooth and janky — image
 * progress events alone can fire dozens of times per frame.
 *
 * `subscribe` must return an unsubscribe function; the subscription is
 * re-established when `key` changes (e.g. a new Bucket instance).
 * Snapshots are compared with Object.is to skip no-op renders.
 */
export function useCoalescedSnapshot<T>(
  subscribe: (onChange: () => void) => () => void,
  getSnapshot: () => T,
  key: unknown = null,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const [snapshot, setSnapshot] = useState<T>(getSnapshot)

  const subscribeRef = useRef(subscribe)
  const getSnapshotRef = useRef(getSnapshot)
  const isEqualRef = useRef(isEqual)

  // "latest ref" pattern, effect-based (render-time ref writes break the
  // React Compiler contract and are flagged by react-hooks v7)
  useEffect(() => {
    subscribeRef.current = subscribe
    getSnapshotRef.current = getSnapshot
    isEqualRef.current = isEqual
  })

  useEffect(() => {
    let disposed = false
    let framePending = false

    const flush = () => {
      framePending = false
      if (disposed) return
      const next = getSnapshotRef.current()
      setSnapshot(prev => (isEqualRef.current(prev, next) ? prev : next))
    }

    const onChange = () => {
      if (framePending) return
      framePending = true
      nextFrame(flush)
    }

    const unsubscribe = subscribeRef.current(onChange)
    // the source may have changed between render and effect
    flush()

    return () => {
      disposed = true
      unsubscribe()
    }
  }, [key])

  return snapshot
}
