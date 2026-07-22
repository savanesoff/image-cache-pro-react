# image-cache-pro-react — working notes for Claude Code

## What this repo is

React bindings for [`image-cache-pro`](https://github.com/savanesoff/image-cache-pro) (the sibling vanilla lib, cloned at `../image-cache-pro`). It exposes that lib's `Controller → Bucket → RenderRequest → FrameQueue` scheduler to React as providers + hooks, so image **decode** and **GPU upload** can be staged off the interaction critical path on resource-constrained devices (set-top boxes / Cobalt, low-power TVs).

This is a **standalone, publishable npm package**. It is consumed by `@oregannetworks/react-kit` (the Onyx STB component lib) and wired into its `Icon` component. Keeping it as its own public package — rather than folding it into react-kit — lets non-Onyx consumers use it and keeps the STB-perf concern isolated.

## Current status: implemented

The binding surface is implemented over the published `image-cache-pro@0.7`:
`<ImageCacheProvider>` (+`useController`), `<BucketProvider>` (+`useBucket`,
`useBucketState`), `useImage`, `<CachedImage>`. Everything is memo'd, refs
follow the effect-based "latest ref" pattern (react-hooks v7 / React
Compiler clean), event-driven state is frame-coalesced
(`src/internal/useCoalescedSnapshot.ts`), lifecycles are SSR + StrictMode
safe, and teardown is deterministic (tests assert zero leaked bytes).
The README is the public API doc; Storybook (`pnpm storybook`) is the demo
and deploys to GH Pages from main.

## The roadmap (why this exists)

1. **(other repo, first)** Refactor + optimise the vanilla `image-cache-pro` to a production-grade, Cobalt-correct scheduler, then **publish to npm** (see `../image-cache-pro/HANDOFF.md`). Sam publishes — never publish yourself.
2. **(this repo, next)** Build the React binding surface over the published core:
   - `Controller` → `<ControllerProvider>`
   - `Bucket` → `<BucketProvider>` / `useBucket`
   - `RenderRequest` → `useImage`
   - plus input/platform render-timing gates (pause warming during active nav/scroll, resume on idle).
3. **(react-kit, after)** react-kit consumes this package and wires it into `Icon`.

## Non-negotiable design constraints

- **Opt-in / zero-default-impact.** A consumer that upgrades react-kit (or installs this) but does **not** explicitly enable it must get exactly today's behaviour. `Icon` defaults stay unchanged.
- **Cobalt won't GPU-upload off-screen pixels.** Staging must reveal real, in-viewport, painted elements — off-screen prewarm alone does nothing on the box. This governs the whole hook design (see the vanilla `HANDOFF.md` §1, §3).
- **React is a peer dependency**, `image-cache-pro` is a direct dependency. Never bundle either.
- **Thin bindings.** Keep scheduling logic in the core; this layer only maps React lifecycle → core objects and wires the input-yield gate.

## Tooling

- **pnpm** (see `packageManager`), **Node ≥ 20**.
- **Vite 8** lib build → `dist/esm` + `dist/cjs/*.cjs` + `dist/types` via `vite-plugin-dts`; `chrome88` target; react + image-cache-pro external (never bundled).
- **Vitest 4** (jsdom + Testing Library; the suite drives the REAL engine — mocked XHR + manual frames via `src/testing/harness.tsx`).
- **ESLint 10 flat config**, type-checked, + react-hooks v7 (eslint-plugin-react's own rules crash on ESLint 10 — deliberately not enabled), import-x, prettier-separate.
- **Storybook 10** (react-vite) — the demo; `Demo/Rails` is the STB workload.
- **changesets** drive releases through CI (`.github/workflows/publish.yaml`). Add a changeset per change; **publishing/versioning is Sam's job.**

## Commands

```sh
pnpm test          # vitest --run
pnpm run lint      # eslint .
pnpm run type-check
pnpm run build     # clean + vite (esm+cjs) + tspc (.d.ts)
```

Run type-check, lint, and tests before any commit. Verify a diff and wait for approval before committing.
