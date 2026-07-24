# image-cache-pro-react

## 0.1.0

### Minor Changes

- fc0c63d: Initial React bindings over image-cache-pro 0.7:

  - `<ImageCacheProvider>` — one engine per app; SSR/StrictMode-safe lifecycle,
    live `ram`/`video`/`canRender` props, `onController` escape hatch
  - `<BucketProvider>` + `useBucket()`/`useBucketState()` — one bucket per UI
    region with live `priority`/`lock`/`videoBudget`; frame-coalesced state
  - `useImage()` — headless request lifecycle (statuses: idle/loading/queued/
    rendered/evicted/error), value-stable size, deterministic teardown
  - `<CachedImage />` — div-based reveal-on-rendered image for embedded
    browsers (explicit dims, `data-state` styling hook, fit modes, overlays)
  - react is a peer dependency; nothing bundled (core + react external)
