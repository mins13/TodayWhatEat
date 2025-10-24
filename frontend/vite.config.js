// vite.config.ts (또는 .js)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // API 프록시
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // ※ 백엔드가 @RequestMapping("/api") 라우팅이면 rewrite 금지!
        rewrite: (path) => path.replace(/^\/api/, ''), // ← 이 줄은 지우세요
      },
      // 파일 프록시 (이미지 등 정적 파일)
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // rewrite 불필요. 그대로 /files/** 로 백엔드에 전달
      },
    },
  },
})
