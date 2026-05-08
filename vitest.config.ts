import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/ui/**', 'jsdom'],
      ['src/domain/migrations.test.ts', 'jsdom'],
    ],
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
  },
});
