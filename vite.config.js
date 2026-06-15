import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3001,
    strictPort: true // Sorgt dafür, dass es wirklich diesen Port nimmt
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html')
        // ↑ Beta-Launch: Die echte App wird deployt, ist aber geheim.
      }
    }
  }
});
