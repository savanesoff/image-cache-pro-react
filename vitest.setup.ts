import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// React Testing Library does not auto-clean between tests when globals are on
// and no framework adapter registers it, so do it explicitly.
afterEach(() => {
  cleanup()
})
