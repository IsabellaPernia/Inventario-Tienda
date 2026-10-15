import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En desarrollo, /api se redirige al backend para evitar problemas de CORS.
// Si el backend corre en otro puerto, cambia el target (o usa VITE_API_URL).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
