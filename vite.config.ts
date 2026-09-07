// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // Esconde o código-fonte original .tsx no F12
    minify: 'esbuild',
  },
  esbuild: {
    drop: ['console', 'debugger'], // Remove automaticamente todos os console.log e debuggers na build final de produção
  },
});