/**
 * image-cache-pro-react — React bindings for the image-cache-pro scheduler.
 *
 * <ImageCacheProvider>  one engine per app (budgets, frame queue, gate)
 *   <BucketProvider>    one bucket per UI region (rail/page/virtual list)
 *     <CachedImage />   or useImage() — one image at one size
 */
export * from './provider'
export * from './bucket'
export * from './image'

// Re-export the core's public surface so consumers need a single import
// (types + classes stay external — nothing is bundled).
export * from 'image-cache-pro'
