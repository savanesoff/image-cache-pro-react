/**
 * Test harness: drives the REAL image-cache-pro engine deterministically —
 * mocked XHR (valid PNG bytes), manually pumped rAF frames, and a
 * synchronous renderer injected through the provider.
 */
import { type Controller, type Img } from 'image-cache-pro'
import { useEffect, type ReactNode } from 'react'
import { BucketProvider, type BucketProviderProps } from '../bucket'
import { ImageCacheProvider } from '../provider'

export const CARD = { width: 10, height: 10 }
export const CARD_BYTES = CARD.width * CARD.height * 3 // RGB
export const COMPRESSED_BYTES = 24
export const IMAGE_RAM = COMPRESSED_BYTES + CARD_BYTES

export const XHR = {
  open: vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => {
    return null as unknown as void
  }),
  send: vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {
    return null as unknown as void
  }),
  setRequestHeader: vi
    .spyOn(XMLHttpRequest.prototype, 'setRequestHeader')
    .mockImplementation(() => {
      return null as unknown as void
    }),
  abort: vi.spyOn(XMLHttpRequest.prototype, 'abort').mockImplementation(() => {
    return null as unknown as void
  }),
}

/** A valid 24-byte PNG header (signature + IHDR size) */
export const pngBuffer = (): ArrayBuffer => {
  const view = new DataView(new ArrayBuffer(COMPRESSED_BYTES))
  view.setUint32(0, 0x89504e47)
  view.setUint32(4, 0x0d0a1a0a)
  view.setUint32(8, 13)
  view.setUint32(12, 0x49484452)
  view.setUint32(16, CARD.width)
  view.setUint32(20, CARD.height)
  return view.buffer
}

/** Deterministic rAF — install in beforeEach via installFrames() */
let frameCallbacks: (() => void)[] = []

export const installFrames = () => {
  frameCallbacks = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number =>
    frameCallbacks.push(() => cb(0)),
  )
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
  globalThis.URL.revokeObjectURL = vi.fn()
}

export const drainFrames = () => {
  let guard = 0

  while (frameCallbacks.length > 0 && guard++ < 1000) {
    const callbacks = frameCallbacks
    frameCallbacks = []
    callbacks.forEach(cb => cb())
  }
}

/** Completes every in-flight network load (XHR + bitmap decode) */
export const pumpNetwork = (controller: Controller) => {
  let guard = 0

  while (controller.network.inFlight.size > 0 && guard++ < 1000) {
    for (const loader of Array.from(controller.network.inFlight.values())) {
      Object.defineProperty(loader.xhr, 'response', {
        value: pngBuffer(),
        configurable: true,
      })
      loader.xhr.onload?.(new ProgressEvent('load'))
      ;(loader as Img).element.onload?.(new Event('load'))
    }
  }
}

/** Loads + warms everything pending */
export const settle = (controller: Controller | null) => {
  if (!controller) return
  pumpNetwork(controller)
  drainFrames()
}

/** Captures the latest controller created by the provider under test */
export const controllerRef: { current: Controller | null } = { current: null }

export function TestCache({
  children,
  bucket,
  ram = 1e9,
  video = 1e9,
}: {
  children?: ReactNode
  bucket?: Omit<BucketProviderProps, 'children'>
  ram?: number
  video?: number
}) {
  return (
    <ImageCacheProvider
      ram={ram}
      video={video}
      units="BYTE"
      renderer={({ done }) => done()}
      canRender={() => true}
      onController={controller => {
        controllerRef.current = controller
      }}
    >
      <BucketProvider name="test-bucket" {...bucket}>
        {children}
      </BucketProvider>
    </ImageCacheProvider>
  )
}

/** Flush provider effects (controller/bucket creation) inside act() */
export const url = (index: number) =>
  `https://cdn.example.com/poster-${index}.png`

export function UseImageProbe({ hook }: { hook: () => unknown }) {
  useEffect(() => undefined)
  void hook()
  return null
}
