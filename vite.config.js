import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/egg-pet-app/',
  optimizeDeps: {
    include: ['@tanstack/react-query'],
  },
})
