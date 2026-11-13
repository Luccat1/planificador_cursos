/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/planificador_cursos/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  server: {
    allowedHosts: ['.loca.lt']
  }
})
