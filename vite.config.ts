import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Ép Vite tạo tên file mới mỗi lần build để tránh cache Cloudflare
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
      },
    },
  },
});
