[![by Protosus](https://raw.githubusercontent.com/savanesoff/protosus/main/public/icons/by-protosus.svg)](https://github.com/savanesoff/image-cache-pro-react)

# image-cache-pro-react

**React bindings for [image-cache-pro](https://github.com/savanesoff/image-cache-pro) —
paint image-heavy UIs on low-power devices without dropping frames.**

[![NPM](https://img.shields.io/npm/v/image-cache-pro-react.svg)](https://www.npmjs.com/package/image-cache-pro-react)
[![Build Status](https://github.com/savanesoff/image-cache-pro-react/actions/workflows/test.yaml/badge.svg?branch=main)](https://github.com/savanesoff/image-cache-pro-react/actions/workflows/test.yaml)
[![Storybook](https://img.shields.io/badge/Storybook-GitHub%20Pages-ff4785)](https://savanesoff.github.io/image-cache-pro-react/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The core engine decodes images ahead of time, warms GPU textures a few per
frame on `requestAnimationFrame`, yields to user input, and evicts against
RAM/GPU budgets you set. This package maps it onto React:

```
<ImageCacheProvider>   one engine per app — budgets, frame queue, input gate
  <BucketProvider>     one bucket per UI region — rail, page, virtual list
    <CachedImage />    one image at one size (or useImage() for headless)
```

Everything is typed end to end, `react` is a peer dependency, nothing is
bundled, and the components are built for Chrome-88-class embedded browsers
(Cobalt / smart TV): `<div>`-based rendering, explicit dimensions, and
re-renders coalesced to at most one per frame.

## Quick start

```sh
npm install image-cache-pro-react
```

```tsx
import {
  ImageCacheProvider,
  BucketProvider,
  CachedImage,
} from 'image-cache-pro-react'

function App() {
  return (
    <ImageCacheProvider
      ram={200}
      video={60}
      units="MB"
      loaders={4}
      canRender={() => !window.myApp.isNavigating} // input-yield gate
    >
      <BucketProvider name="top-rail" priority={1}>
        {posters.map(poster => (
          <CachedImage
            key={poster.id}
            url={poster.url}
            width={320}
            height={180}
            className="poster"
          />
        ))}
      </BucketProvider>
    </ImageCacheProvider>
  )
}
```

`CachedImage` stays a colored placeholder until the engine has decoded the
bitmap **and** warmed the GPU texture, then reveals it in one cheap paint —
the reveal is the scheduling gate. Style states via the `data-state`
attribute (`idle | loading | queued | rendered | evicted | error`):

```css
.poster {
  opacity: 0.35;
  transition: opacity 250ms ease-out;
}
.poster[data-state='rendered'] {
  opacity: 1;
}
```

## API

### `<ImageCacheProvider {...ControllerProps}>`

Owns one engine `Controller` for the subtree. SSR-safe and StrictMode-safe
(the engine is created in an effect and fully cleared on unmount).

- All [`ControllerProps`](https://github.com/savanesoff/image-cache-pro#api)
  are accepted: `ram`, `video`, `units`, `loaders`, `frameBudget`, `hwRank`,
  `canRender`, `renderer`, `gpuDataFull`…
- **Live props**: `ram` / `video` (runtime budget setters — e.g. shrink image
  memory while media plays) and `canRender` (the consumer-owned input gate).
  Everything else is construction-time.
- `onController={c => …}` — imperative escape hatch for input layers living
  outside React.

### `useController(): Controller | null`

Imperative engine access: `controller.pause()` / `resume()`,
`controller.setVideoBudget(n)`, stats, the frame queue.

### `<BucketProvider name priority lock videoBudget>`

Owns one `Bucket` for a UI region. `priority`, `lock` and `videoBudget` are
**live** — changing `priority` re-sorts pending work on the next frame (a
focused rail jumps the queue). Unmount clears every request in the region.

### `useBucket(): Bucket | null` / `useBucketState(): BucketState`

`useBucket` for imperative control (`bucket.pause()`, `setPriority`).
`useBucketState` for UI state — `{ loaded, loading, rendered, loadProgress,
requestCount }` — with re-renders **coalesced to one per frame** regardless
of how bursty the underlying events are.

### `useImage(props): UseImageResult`

The headless hook behind `CachedImage`:

```ts
const { status, rendered, src, progress, error, request } = useImage({
  url, // image identity
  width,
  height, // target size (required — enables the decoder bypass)
  priority, // live — re-sorts the frame queue
  visible, // default true: mounted images are eviction-locked;
  //   pass false for off-screen precache that may evict
  trackProgress, // opt-in progress re-renders
})
```

The request is created per `url+width+height` (object identity of your props
never churns it) and force-cleared on unmount — deterministic teardown,
virtual-list safe. Eviction under memory pressure surfaces as
`status: 'evicted'`; the library never re-requests automatically (no
re-request storms) — remount or change a key to re-request.

### `<CachedImage />`

`useImage` + a device-friendly `<div>` renderer: explicit `width`/`height`
(embedded browsers paint auto-sized boxes as 0×0), `background-image` reveal
on the real on-screen node, `fit` (`fill | cover | contain`),
`placeholderColor`, overlay `children`, `onRendered`/`onError`, all DOM
props forwarded, `ref` to the div.

### Core re-exports

The full `image-cache-pro` surface is re-exported (`Controller`, `Bucket`,
`RenderRequest`, all types) so a single import serves both layers.

## Recipes

**Focus-driven priorities** (TV rails):

```tsx
<BucketProvider name="rail" priority={focusedRow === index ? 10 : 0}>
```

**Pause warming during navigation** (input layer owns the gate):

```tsx
<ImageCacheProvider canRender={() => !inputBusy()} … >
// or imperatively:
const controller = useController()
controller?.pause()  // route transition start
controller?.resume() // idle
```

**Shrink image memory while video plays:**

```tsx
<ImageCacheProvider video={isPlaying ? 32 : 240} units="MB" … >
```

**Virtual lists** — one long-lived `BucketProvider` for the list; mount and
unmount `CachedImage` slots freely. Re-visiting a cached URL costs no
network and no decode, only a budgeted re-warm.

## Storybook / demo

**Live: <https://savanesoff.github.io/image-cache-pro-react/>**

`pnpm storybook` runs it locally — including the Rails demo (the STB
workload with live budget/priority controls) and a memory-pressure story
where you can watch eviction happen.

## Development

```sh
pnpm install
pnpm test            # vitest — full-stack through the real engine
pnpm lint            # prettier + eslint (type-checked)
pnpm run type-check
pnpm run build       # ESM + CJS + .d.ts (react + core stay external)
pnpm storybook
```

## License

[MIT](LICENSE) — © [Samvel Avanesov](https://www.linkedin.com/in/samvel-avanesov)
