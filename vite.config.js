import { defineConfig } from 'vite';

export default defineConfig({ 
  // Set base to the repository name only. 
  // This is the standard setting for GitHub Pages.
  base: process.env.NODE_ENV === 'production' 
        ? '/CCLab_AutobiographicalGame/' 
        : '/',
});