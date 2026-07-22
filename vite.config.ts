import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    lib: {
      entry: path.resolve(dirname, 'src/index.ts'),
      name: 'imageCacheProReact',
    },
    sourcemap: true,
    rollupOptions: {
      // Never bundle React, the core lib, or the runtime helpers — the
      // consumer provides them (React as a peer, image-cache-pro as a dep).
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'image-cache-pro',
        'tslib',
      ],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].js',
          dir: 'dist/esm',
        },
        {
          format: 'cjs',
          entryFileNames: '[name].js',
          dir: 'dist/cjs',
        },
      ],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
})
