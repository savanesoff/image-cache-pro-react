import {
  RenderRequest,
  type RenderRequestEvent,
  type ImgProps,
} from 'image-cache-pro'
import { useEffect, useRef, useState } from 'react'
import { useBucket } from '../bucket/useBucket'

export type ImageStatus =
  | 'idle' // no bucket/engine yet (SSR, provider booting)
  | 'loading' // network/decode in flight
  | 'queued' // decoded, waiting for a frame-budget slot
  | 'rendered' // decoded + GPU-warm — safe to paint for free
  | 'evicted' // released under memory pressure (re-mount to re-request)
  | 'error'

export type UseImageProps = {
  /** Image URL (identity of the underlying shared image) */
  url: string
  /**
   * Target render size in CSS pixels. Enables the core's decoder bypass and
   * sizes the GPU texture — REQUIRED, and stable by value (the request is
   * re-created only when url/width/height change).
   */
  width: number
  height: number
  /** Scheduling priority — live (re-sorts the frame queue) */
  priority?: number
  /**
   * Marks the request as visible: visible requests are never evicted.
   * Defaults to true (a mounted hook usually paints); set false for
   * off-screen precaching that MAY be evicted under pressure.
   */
  visible?: boolean
  /** Re-render on network progress (off by default — extra renders) */
  trackProgress?: boolean
  /** Forwarded to the loader (auth headers etc.) */
  headers?: ImgProps['headers']
  /** Skip mime sniffing entirely when known */
  mimeType?: ImgProps['mimeType']
}

export type UseImageResult = {
  status: ImageStatus
  /** True when the image is decoded + GPU-warm (paint is cheap) */
  rendered: boolean
  /**
   * Paint source once rendered: the blob URL of the decoded bytes when
   * available (no second fetch), else the original URL. Empty until rendered.
   */
  src: string
  /** 0..1 network progress (only updates with trackProgress) */
  progress: number
  /** Loader error, if any */
  error: string | null
  /** The live request — imperative escape hatch (setPriority, visible…) */
  request: RenderRequest | null
}

type ImageState = UseImageResult

const IDLE: ImageState = {
  status: 'idle',
  rendered: false,
  src: '',
  progress: 0,
  error: null,
  request: null,
}

/**
 * One image at one size, scheduled through the nearest bucket.
 *
 * Lifecycle: the RenderRequest is created in an effect and force-cleared on
 * unmount / url / size change — deterministic teardown, no leaks across
 * virtual-list churn. Eviction under memory pressure surfaces as
 * status 'evicted' (no automatic re-request storms — remount or change a
 * key to re-request).
 */
export function useImage({
  url,
  width,
  height,
  priority,
  visible = true,
  trackProgress = false,
  headers,
  mimeType,
}: UseImageProps): UseImageResult {
  const bucket = useBucket()
  const [state, setState] = useState<ImageState>(IDLE)
  const requestRef = useRef<RenderRequest | null>(null)

  // live-tunable values, read by the creation effect without retriggering it
  const liveRef = useRef({ priority, visible, trackProgress })
  const optionsRef = useRef({ headers, mimeType })

  useEffect(() => {
    liveRef.current = { priority, visible, trackProgress }
  })

  useEffect(() => {
    // no bucket → nothing to do; state was initialized IDLE and a missing
    // bucket only occurs while the providers (un)mount around us
    if (!bucket) {
      return
    }

    let unmounted = false
    const request = new RenderRequest({
      bucket,
      url,
      size: { width, height },
      priority: liveRef.current.priority,
      ...optionsRef.current,
    })
    request.visible = liveRef.current.visible
    requestRef.current = request

    const paintSrc = () => request.image.element.src || url

    const onRendered = () => {
      setState({
        status: 'rendered',
        rendered: true,
        src: paintSrc(),
        progress: 1,
        error: null,
        request,
      })
    }

    const onLoadEnd = () => {
      setState(prev =>
        prev.rendered
          ? prev
          : { ...prev, status: 'queued', progress: 1, error: null },
      )
    }

    const onProgress = (event: RenderRequestEvent<'progress'>) => {
      if (!liveRef.current.trackProgress) return
      setState(prev =>
        prev.rendered ? prev : { ...prev, progress: event.progress ?? 0 },
      )
    }

    const onError = (event: RenderRequestEvent<'error'>) => {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: event.statusText || 'load error',
      }))
    }

    const onClear = () => {
      // our own teardown also emits 'clear' — only external clears
      // (eviction) reach state
      if (unmounted) return
      requestRef.current = null
      setState(prev => ({
        ...prev,
        status: 'evicted',
        rendered: false,
        src: '',
        request: null,
      }))
    }

    request.on('rendered', onRendered)
    request.on('loadend', onLoadEnd)
    request.on('progress', onProgress)
    request.on('error', onError)
    request.on('clear', onClear)

    setState(
      request.rendered
        ? {
            status: 'rendered',
            rendered: true,
            src: paintSrc(),
            progress: 1,
            error: null,
            request,
          }
        : { ...IDLE, status: 'loading', request },
    )

    return () => {
      unmounted = true
      requestRef.current = null
      // force: a mounted-but-visible request must still release on unmount
      request.clear(true)
    }
  }, [bucket, url, width, height])

  // live priority (no request re-creation)
  useEffect(() => {
    if (priority !== undefined) {
      requestRef.current?.setPriority(priority)
    }
  }, [priority])

  // live visibility (eviction lock)
  useEffect(() => {
    const request = requestRef.current

    if (request) {
      request.visible = visible
    }
  }, [visible])

  return state
}
