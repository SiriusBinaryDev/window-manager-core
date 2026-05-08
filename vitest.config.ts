import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@window-manager/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@window-manager/react': resolve(__dirname, 'packages/react/src/index.tsx'),
    },
  },
});
