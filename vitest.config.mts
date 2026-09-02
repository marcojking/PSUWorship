import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vitest does not read tsconfig `paths`, so the `@/` alias is restated here.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // .tsx matters: a component test under a ts-only glob is silently never
  // collected and the suite still reports green.
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
