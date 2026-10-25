import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

/**
 * Unit tests for pure logic: utils, selectors, reducers/thunks through a real store,
 * persistence (validation, migrations). No DOM needed → the fast `node` environment.
 * Shares the Vite config, so the `@/` alias works in tests too.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      setupFiles: ['./src/test/setup.ts'],
    },
  }),
)
