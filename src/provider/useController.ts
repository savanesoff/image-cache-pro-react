import { type Controller } from 'image-cache-pro'
import { useContext } from 'react'
import { ImageCacheContext } from './ImageCacheContext'

/**
 * The subtree's Controller — `null` until the provider has created it
 * (first client effect) and during SSR.
 *
 * Use it for imperative control: `controller.pause()/resume()`,
 * `controller.setVideoBudget(n)`, stats, etc.
 */
export function useController(): Controller | null {
  return useContext(ImageCacheContext)
}
