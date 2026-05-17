import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3001,
    strictPort: true // Sorgt dafür, dass es wirklich diesen Port nimmt
  }
});
