import { act, render } from '@testing-library/react'
import { type Controller } from 'image-cache-pro'
import { StrictMode } from 'react'
import { controllerRef, installFrames, TestCache } from '../testing/harness'
import { ImageCacheProvider } from './ImageCacheProvider'
import { useController } from './useController'

beforeEach(() => {
  installFrames()
  controllerRef.current = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function Probe({ onValue }: { onValue: (c: Controller | null) => void }) {
  onValue(useController())
  return null
}

describe('ImageCacheProvider', () => {
  it('creates a controller and exposes it via useController + onController', () => {
    const seen: (Controller | null)[] = []
    render(
      <TestCache>
        <Probe onValue={c => seen.push(c)} />
      </TestCache>,
    )
    expect(controllerRef.current).not.toBeNull()
    expect(seen.at(-1)).toBe(controllerRef.current)
  })

  it('is null before mount effects and during SSR-ish first render', () => {
    const seen: (Controller | null)[] = []
    render(
      <TestCache>
        <Probe onValue={c => seen.push(c)} />
      </TestCache>,
    )
    // first client render happens before the provider effect
    expect(seen[0]).toBeNull()
    expect(seen.at(-1)).not.toBeNull()
  })

  it('clears the controller on unmount (deterministic teardown)', () => {
    const { unmount } = render(<TestCache />)
    const controller = controllerRef.current
    expect(controller).not.toBeNull()
    const clearSpy = vi.spyOn(controller as Controller, 'clear')
    unmount()
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })

  it('survives StrictMode double-mounting with a working engine', () => {
    const instances: Controller[] = []
    render(
      <StrictMode>
        <ImageCacheProvider
          ram={1e9}
          video={1e9}
          units="BYTE"
          renderer={({ done }) => done()}
          onController={c => instances.push(c)}
        />
      </StrictMode>,
    )
    // effect ran twice → two instances; the FIRST was cleared, the LAST works
    expect(instances.length).toBe(2)
    expect(instances[0]).not.toBe(instances[1])
  })

  it('applies live budget changes through the runtime setters', () => {
    const { rerender } = render(<TestCache ram={1000} video={500} />)
    const controller = controllerRef.current as Controller
    expect(controller.ram.size).toBe(1000)
    expect(controller.video.size).toBe(500)

    act(() => {
      rerender(<TestCache ram={2000} video={250} />)
    })
    expect(controller.ram.size).toBe(2000)
    expect(controller.video.size).toBe(250)
  })
})
