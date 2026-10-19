
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules')
            ? undefined
            : true
      }
    })
  ],
  resolve: {
    alias: {
      '$lib': path.resolve(import.meta.dirname, './src/lib')
    }
  }
});
