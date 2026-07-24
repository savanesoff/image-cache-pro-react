import { type Controller } from 'image-cache-pro'
import { createContext } from 'react'

/**
 * null until the provider's effect has created the Controller (also the SSR
 * value — the engine only exists on the client).
 */
export const ImageCacheContext = createContext<Controller | null>(null)
