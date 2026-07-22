import { Bucket } from 'image-cache-pro'
import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import { useController } from '../provider/useController'
import { BucketContext } from './BucketContext'

export type BucketProviderProps = {
  children?: ReactNode
  /** Bucket name (diagnostics/stats) */
  name?: string
  /**
   * Scheduling priority for the bucket's requests — live: changing the prop
   * re-sorts pending work (a focused rail jumps the queue next frame).
   */
  priority?: number
  /** Locked buckets are exempt from eviction — live. */
  lock?: boolean
  /** Optional per-bucket GPU cap in controller units — live. */
  videoBudget?: number
}

/**
 * Owns one image-cache-pro `Bucket` for a UI region (a rail, a page, a
 * virtual list). Requests created below (useImage/CachedImage) register
 * against it. `bucket.clear()` on unmount releases every request, listener
 * and byte of accounting for the region.
 */
export const BucketProvider = memo(function BucketProvider({
  children,
  name,
  priority = 0,
  lock = false,
  videoBudget,
}: BucketProviderProps) {
  const controller = useController()
  const [bucket, setBucket] = useState<Bucket | null>(null)
  const initialRef = useRef({ name, priority, lock, videoBudget })

  useEffect(() => {
    if (!controller) return
    const instance = new Bucket({ controller, ...initialRef.current })
    setBucket(instance)

    return () => {
      instance.clear()
      setBucket(null)
    }
  }, [controller])

  // live-tunable props
  useEffect(() => {
    if (bucket && bucket.priority !== priority) {
      bucket.setPriority(priority)
    }
  }, [bucket, priority])

  useEffect(() => {
    if (bucket) {
      bucket.locked = lock
    }
  }, [bucket, lock])

  useEffect(() => {
    if (bucket && videoBudget !== undefined) {
      bucket.setVideoBudget(videoBudget)
    }
  }, [bucket, videoBudget])

  return (
    <BucketContext.Provider value={bucket}>{children}</BucketContext.Provider>
  )
})
