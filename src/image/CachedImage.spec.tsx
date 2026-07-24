import { act, render, screen } from '@testing-library/react'
import { type Controller } from 'image-cache-pro'
import {
  CARD,
  CARD_BYTES,
  controllerRef,
  installFrames,
  settle,
  TestCache,
  url,
} from '../testing/harness'
import { CachedImage } from './CachedImage'

beforeEach(() => {
  installFrames()
  controllerRef.current = null
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const renderImage = (props: Partial<Parameters<typeof CachedImage>[0]> = {}) =>
  render(
    <TestCache>
      <CachedImage
        url={url(0)}
        width={CARD.width}
        height={CARD.height}
        data-testid="img"
        {...props}
      />
    </TestCache>,
  )

const el = () => screen.getByTestId('img')

describe('CachedImage', () => {
  it('renders a placeholder div with explicit dimensions (Cobalt-safe)', () => {
    renderImage()
    const div = el()
    expect(div).toBeInTheDocument()
    expect(div.style.width).toBe(`${CARD.width}px`)
    expect(div.style.height).toBe(`${CARD.height}px`)
    expect(div.style.backgroundImage).toBe('')
    expect(div.dataset.state).toBe('loading')
  })

  it('reveals the bitmap once decoded + GPU-warm (the reveal is the gate)', () => {
    const onRendered = vi.fn()
    renderImage({ onRendered })

    act(() => {
      settle(controllerRef.current)
    })

    const div = el()
    expect(div.dataset.state).toBe('rendered')
    expect(div.style.backgroundImage).toContain('blob:mock')
    expect(onRendered).toHaveBeenCalledTimes(1)
  })

  it('releases its request (and accounting) on unmount', () => {
    const { unmount } = renderImage()

    act(() => {
      settle(controllerRef.current)
    })

    const controller = controllerRef.current as Controller
    expect(controller.video.getUsedSpace().bytes).toBe(CARD_BYTES)

    unmount()
    expect(controller.video.getUsedSpace().bytes).toBe(0)
  })

  it('swaps the request when the url changes', () => {
    const { rerender } = renderImage()

    act(() => {
      settle(controllerRef.current)
    })
    expect(el().style.backgroundImage).toContain('blob:mock')

    act(() => {
      rerender(
        <TestCache>
          <CachedImage
            url={url(1)}
            width={CARD.width}
            height={CARD.height}
            data-testid="img"
          />
        </TestCache>,
      )
    })
    // new request: back to loading until the new image settles
    expect(el().dataset.state).toBe('loading')

    act(() => {
      settle(controllerRef.current)
    })
    expect(el().dataset.state).toBe('rendered')
    // still exactly one request's worth of video memory
    const controller = controllerRef.current as Controller
    expect(controller.video.getUsedSpace().bytes).toBe(CARD_BYTES)
  })

  it('does not recreate the request when an equal-value size is passed', () => {
    const controllerSeen = () => controllerRef.current as Controller
    const { rerender } = renderImage()

    act(() => {
      settle(controllerRef.current)
    })
    const statsBefore = controllerSeen().getRequestsStats()

    act(() => {
      // fresh object, same values — must NOT churn the request
      rerender(
        <TestCache>
          <CachedImage
            url={url(0)}
            width={CARD.width}
            height={CARD.height}
            data-testid="img"
          />
        </TestCache>,
      )
    })
    expect(controllerSeen().getRequestsStats()).toEqual(statsBefore)
    expect(el().dataset.state).toBe('rendered')
  })

  it('reports load errors via data-state and onError', () => {
    const onError = vi.fn()
    render(
      <TestCache>
        <CachedImage
          url={url(9)}
          width={CARD.width}
          height={CARD.height}
          data-testid="img"
          onError={onError}
        />
      </TestCache>,
    )

    act(() => {
      const controller = controllerRef.current as Controller
      const loader = Array.from(controller.network.inFlight.values())[0]
      // retry: 3 by default — exhaust them
      loader.xhr.onerror?.(new ProgressEvent('error'))
    })

    // loader retries with backoff; fail all retries deterministically
    act(() => {
      vi.useFakeTimers()
      const controller = controllerRef.current as Controller

      for (let i = 0; i < 5; i++) {
        vi.runAllTimers()
        const loader = Array.from(controller.network.inFlight.values())[0]
        loader?.xhr.onerror?.(new ProgressEvent('error'))
      }

      vi.useRealTimers()
    })

    expect(el().dataset.state).toBe('error')
    expect(onError).toHaveBeenCalled()
  })

  it('marks evicted state when the engine reclaims the texture', () => {
    render(
      <TestCache>
        <CachedImage
          url={url(0)}
          width={CARD.width}
          height={CARD.height}
          data-testid="a"
          visible={false}
        />
      </TestCache>,
    )

    act(() => {
      settle(controllerRef.current)
    })
    expect(screen.getByTestId('a').dataset.state).toBe('rendered')

    // shrink the GPU budget below the texture — evicts the unlocked request
    act(() => {
      controllerRef.current?.setVideoBudget(1)
    })
    expect(screen.getByTestId('a').dataset.state).toBe('evicted')
  })

  it('visible images survive memory pressure (eviction lock)', () => {
    render(
      <TestCache>
        <CachedImage
          url={url(0)}
          width={CARD.width}
          height={CARD.height}
          data-testid="img"
        />
      </TestCache>,
    )

    act(() => {
      settle(controllerRef.current)
    })

    act(() => {
      controllerRef.current?.setVideoBudget(1)
    })
    // visible (default) → locked → still rendered; overflow reported instead
    expect(el().dataset.state).toBe('rendered')
  })

  it('applies rotated load options (headers) to the next request', () => {
    const { rerender } = render(
      <TestCache>
        <CachedImage
          url={url(0)}
          width={CARD.width}
          height={CARD.height}
          headers={{ 'Content-Type': 'image/jpeg' }}
          data-testid="img"
        />
      </TestCache>,
    )

    act(() => {
      settle(controllerRef.current)
    })

    // rotate headers AND change the url — the new request must carry the
    // latest options (not the first-render snapshot)
    act(() => {
      rerender(
        <TestCache>
          <CachedImage
            url={url(1)}
            width={CARD.width}
            height={CARD.height}
            headers={{ 'Content-Type': 'image/png' }}
            data-testid="img"
          />
        </TestCache>,
      )
    })

    const controller = controllerRef.current as Controller
    const image = controller.cache.get(url(1))
    expect(image?.headers).toEqual({ 'Content-Type': 'image/png' })
  })

  it('recovers cleanly when its bucket provider remounts around it', () => {
    const tree = (bucketKey: number) => (
      <TestCache key={bucketKey}>
        <CachedImage
          url={url(0)}
          width={CARD.width}
          height={CARD.height}
          data-testid="img"
        />
      </TestCache>
    )
    const { rerender } = render(tree(1))

    act(() => {
      settle(controllerRef.current)
    })
    expect(el().dataset.state).toBe('rendered')

    // remount the providers (new engine + bucket) — never stale-rendered
    act(() => {
      rerender(tree(2))
    })
    expect(el().dataset.state).not.toBe('rendered')

    act(() => {
      settle(controllerRef.current)
    })
    expect(el().dataset.state).toBe('rendered')
  })

  it('renders overlay children above the image', () => {
    renderImage({ children: <span>badge</span> })
    expect(screen.getByText('badge')).toBeInTheDocument()
  })
})
