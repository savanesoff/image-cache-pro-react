import { act, render } from '@testing-library/react'
import { type Bucket } from 'image-cache-pro'
import { useEffect } from 'react'
import { controllerRef, installFrames, TestCache } from '../testing/harness'
import { useBucket } from './useBucket'

beforeEach(() => {
  installFrames()
  controllerRef.current = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const seen: { current: Bucket | null } = { current: null }

function Probe() {
  const bucket = useBucket()

  useEffect(() => {
    seen.current = bucket
  })

  return null
}

describe('BucketProvider', () => {
  it('creates a bucket bound to the controller with initial props', () => {
    render(
      <TestCache bucket={{ name: 'rail', priority: 3, lock: true }}>
        <Probe />
      </TestCache>,
    )
    const bucket = seen.current as Bucket
    expect(bucket).not.toBeNull()
    expect(bucket.name).toBe('rail')
    expect(bucket.priority).toBe(3)
    expect(bucket.locked).toBe(true)
    expect(bucket.controller).toBe(controllerRef.current)
  })

  it('applies live priority and lock changes', () => {
    const { rerender } = render(
      <TestCache bucket={{ priority: 0, lock: false }}>
        <Probe />
      </TestCache>,
    )
    const bucket = seen.current as Bucket
    const setPriority = vi.spyOn(bucket, 'setPriority')

    act(() => {
      rerender(
        <TestCache bucket={{ priority: 9, lock: true }}>
          <Probe />
        </TestCache>,
      )
    })
    expect(setPriority).toHaveBeenCalledWith(9)
    expect(bucket.locked).toBe(true)
  })

  it('clears the bucket on unmount', () => {
    const { unmount } = render(
      <TestCache>
        <Probe />
      </TestCache>,
    )
    const bucket = seen.current as Bucket
    const clearSpy = vi.spyOn(bucket, 'clear')
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  })
})
