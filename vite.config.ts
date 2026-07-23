import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // The university's syllabus PDF endpoint sends no CORS headers, so the
      // browser can't fetch it directly. Dev only — a static build has no proxy
      // and the app falls back to "upload the PDF instead".
      '/syllabus-pdf': {
        target: 'https://www.kyoumu.jimu.yamaguchi-u.ac.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/syllabus-pdf/, '/portal/Pdf/Pdf.aspx'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
