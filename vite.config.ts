import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss()
  ],
  // Workaround for Vite HMR limitation where Tailwind CSS v4 directives occasionally fail to rebuild on route changes without forcing watch polls
  server: {
    watch: {
      usePolling: true
    }
  }
});
