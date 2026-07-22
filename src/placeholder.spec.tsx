import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME, useImageCacheProReactReady } from './placeholder'

function Probe() {
  const ready = useImageCacheProReactReady()
  return <div data-testid="probe">{ready ? 'ready' : 'pending'}</div>
}

describe('image-cache-pro-react scaffold', () => {
  it('exposes the package name', () => {
    expect(PACKAGE_NAME).toBe('image-cache-pro-react')
  })

  it('reports ready after mount', async () => {
    render(<Probe />)
    // The mount effect flushes synchronously under RTL's act wrapper.
    expect(await screen.findByText('ready')).toBeInTheDocument()
  })
})
