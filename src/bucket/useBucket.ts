import { type Bucket } from 'image-cache-pro'
import { useContext } from 'react'
import { BucketContext } from './BucketContext'

/**
 * The nearest BucketProvider's Bucket — `null` until created.
 * Use for imperative control: `bucket.pause()/resume()`,
 * `bucket.setPriority(n)`, `bucket.setVideoBudget(n)`.
 */
export function useBucket(): Bucket | null {
  return useContext(BucketContext)
}
