import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/TurboCell/' // 关键：适配GitHub Pages的仓库路径
})