import path from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      name: 'image-cache-react',
    },
    // Cobalt is a Chrome-88-class browser — the published bundle must not
    // assume newer syntax.
    target: 'chrome88',
    sourcemap: true,
    rollupOptions: {
      // never bundle react or the core engine — peers/deps of the consumer
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'image-cache-pro',
      ],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].js',
          dir: 'dist/esm',
        },
        {
          // .cjs: the package is type:module — plain .js here would be
          // (mis)interpreted as ESM by Node and bundlers (publint)
          format: 'cjs',
          entryFileNames: '[name].cjs',
          dir: 'dist/cjs',
        },
      ],
    },
  },
  plugins: [
    dts({
      outDirs: ['dist/types'],
      entryRoot: 'src',
      include: ['src'],
      exclude: [
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.stories.tsx',
        'src/testing/**',
        // internal helpers are bundled into the JS but are not public API and
        // are not referenced by any public type — keep their .d.ts out of dist
        'src/internal/**',
      ],
    }),
  ],
})
