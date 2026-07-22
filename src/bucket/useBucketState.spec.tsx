import { act, render, screen } from '@testing-library/react'
import { CachedImage } from '../image/CachedImage'
import {
  CARD,
  controllerRef,
  drainFrames,
  installFrames,
  pumpNetwork,
  settle,
  TestCache,
  url,
} from '../testing/harness'
import { useBucketState } from './useBucketState'

beforeEach(() => {
  installFrames()
  controllerRef.current = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

let renderCount = 0

function StatePanel() {
  const state = useBucketState()
  renderCount++
  return (
    <div data-testid="panel" data-rendered={String(state.rendered)}>
      {`${state.requestCount}:${Math.round(state.loadProgress * 100)}`}
    </div>
  )
}

describe('useBucketState', () => {
  it('aggregates request count, progress and rendered state', () => {
    render(
      <TestCache>
        <StatePanel />
        <CachedImage url={url(0)} width={CARD.width} height={CARD.height} />
        <CachedImage url={url(1)} width={CARD.width} height={CARD.height} />
      </TestCache>,
    )

    act(() => {
      settle(controllerRef.current)
      drainFrames() // flush the coalesced snapshot
    })

    const panel = screen.getByTestId('panel')
    expect(panel.dataset.rendered).toBe('true')
    expect(panel.textContent).toBe('2:100')
  })

  it('coalesces event bursts into at most one render per frame', () => {
    render(
      <TestCache>
        <StatePanel />
        <CachedImage url={url(0)} width={CARD.width} height={CARD.height} />
        <CachedImage url={url(1)} width={CARD.width} height={CARD.height} />
        <CachedImage url={url(2)} width={CARD.width} height={CARD.height} />
      </TestCache>,
    )

    const before = renderCount

    act(() => {
      // burst: three loads + warms emit dozens of bucket events
      pumpNetwork(controllerRef.current!)
      drainFrames()
    })

    // far fewer renders than events: one per flushed frame, not per event
    expect(renderCount - before).toBeLessThanOrEqual(4)
  })
})
