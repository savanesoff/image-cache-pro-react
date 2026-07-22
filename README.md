# image-cache-pro-react

React bindings for [`image-cache-pro`](https://github.com/savanesoff/image-cache-pro) — providers and hooks that stage image **decode** and **GPU upload** off the interaction critical path on resource-constrained devices (set-top boxes / Cobalt, low-power smart TVs).

> **Status: scaffold.** The toolchain (build, types, tests, CI, publishing) is fully wired, but the binding surface is not implemented yet. It is designed in a dedicated session and then consumed by `@oregannetworks/react-kit`'s `Icon`. See [`CLAUDE.md`](./CLAUDE.md) for the roadmap.

## Why

On Cobalt, a storefront that mounts a screenful of rail posters at once triggers a **simultaneous decode + GPU-blit stampede** during navigation — the dominant STB perf cost (measured ~65% render CPU p90 during a nav burst), independent of re-renders or rounded corners. `image-cache-pro` serialises that work through a budgeted `Controller → Bucket → RenderRequest → FrameQueue` pipeline. This package exposes that pipeline to React idiomatically.

## Design constraints (load-bearing)

- **Opt-in only.** Consuming apps that upgrade must see **zero** behavioural change unless they explicitly enable it.
- **Cobalt won't GPU-upload off-screen pixels** — staging must reveal real on-screen elements, not rely on off-screen prewarm alone.
- **Peer, not bundled** — React is a peer dependency; `image-cache-pro` is a direct dependency.

## Install

```sh
pnpm add image-cache-pro-react image-cache-pro
# react / react-dom are peers you already have
```

## Development

```sh
pnpm install
pnpm test          # vitest (jsdom + Testing Library)
pnpm run lint      # eslint (flat config)
pnpm run type-check
pnpm run build     # vite lib (esm + cjs) + tspc .d.ts
```

Releases are driven by [changesets](https://github.com/changesets/changesets) via CI. **Publishing is a maintainer action** — add a changeset in your PR; the release workflow versions and publishes on merge.

## License

MIT © Samvel Avanesov
