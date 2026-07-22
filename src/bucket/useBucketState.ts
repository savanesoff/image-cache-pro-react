import { useCallback } from 'react'
import { shallowEqual } from '../internal/shallowEqual'
import { useCoalescedSnapshot } from '../internal/useCoalescedSnapshot'
import { useBucket } from './useBucket'

export type BucketState = {
  /** All images of the bucket finished loading */
  loaded: boolean
  /** At least one image is loading */
  loading: boolean
  /** Every request has rendered (decoded + GPU-warm) */
  rendered: boolean
  /** 0..1 network/decode progress across the bucket's images */
  loadProgress: number
  /** Number of requests currently registered */
  requestCount: number
}

const IDLE: BucketState = {
  loaded: false,
  loading: false,
  rendered: false,
  loadProgress: 0,
  requestCount: 0,
}

/**
 * Live aggregate state of the nearest bucket (progress bars / skeleton
 * toggles). Re-renders are coalesced to at most one per frame no matter how
 * bursty the underlying events are.
 */
export function useBucketState(): BucketState {
  const bucket = useBucket()

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!bucket) return () => undefined
      bucket.on('progress', onChange)
      bucket.on('loadend', onChange)
      bucket.on('loading', onChange)
      bucket.on('rendered', onChange)
      bucket.on('render-progress', onChange)
      bucket.on('update', onChange)

      return () => {
        bucket.off('progress', onChange)
        bucket.off('loadend', onChange)
        bucket.off('loading', onChange)
        bucket.off('rendered', onChange)
        bucket.off('render-progress', onChange)
        bucket.off('update', onChange)
      }
    },
    [bucket],
  )

  const getSnapshot = useCallback((): BucketState => {
    if (!bucket) return IDLE

    return {
      loaded: bucket.loaded,
      loading: bucket.loading,
      rendered: bucket.rendered,
      loadProgress: bucket.loadProgress,
      requestCount: bucket.requests.size,
    }
  }, [bucket])

  return useCoalescedSnapshot(subscribe, getSnapshot, bucket, shallowEqual)
}
