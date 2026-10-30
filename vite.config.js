import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    server: {
      port: 5177,
      strictPort: true,
      proxy: {
        // Backend de Inventario (InventarioWebFlux)
        '/api': { target: env.VITE_INVENTARIO_API_URL || 'http://localhost:8081', changeOrigin: true }
      }
    }
  }
})
