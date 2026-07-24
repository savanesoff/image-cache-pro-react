import { type Bucket } from 'image-cache-pro'
import { createContext } from 'react'

/** null until the BucketProvider's effect has created the Bucket */
export const BucketContext = createContext<Bucket | null>(null)
