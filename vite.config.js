/**
 * vite.config.js
 * Vite configuration file for the Universe Portfolio SPA build process.
 */

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './', // Assuming we are running vite from the root directory of 3DGridContentPreview-main
  base: '/Portfolio/', // GitHub Pages base path for aj-glover.github.io/Portfolio
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true, // Clears previous build output
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'), // We will create a new index.html pointing to the SPA entry point
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  server: {
    port: 3000, // Standard dev port for Vite
  }
});