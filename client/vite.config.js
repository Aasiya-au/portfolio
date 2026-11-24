import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: { allow: ['..'] }, // lets the client import ../content/*.json
    proxy: { '/api': 'http://localhost:3001' }, // chatbot + contact form talk to the Express server
  },
});
