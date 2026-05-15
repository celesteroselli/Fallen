import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoBasePath = '/Fallen/';

export default defineConfig({
  // GitHub Pages serves project sites from /REPO_NAME/.
  // Change this to '/' if you later deploy to a custom domain or username.github.io.
  base: process.env.NODE_ENV === 'production' ? repoBasePath : '/',
  plugins: [react()]
});
