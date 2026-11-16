/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function copy404Plugin(): Plugin {
  return {
    name: 'copy-404-plugin',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const notFoundPath = path.join(distDir, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
      }
    }
  };
}

export default defineConfig({
  base: '/planificador_cursos/',
  plugins: [react(), copy404Plugin()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  server: {
    allowedHosts: ['.loca.lt']
  }
});

