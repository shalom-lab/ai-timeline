import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages: https://shalom-lab.github.io/ai-timeline/
export default defineConfig({
  plugins: [react()],
  base: '/ai-timeline/',
})
