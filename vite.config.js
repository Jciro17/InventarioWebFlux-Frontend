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
        '/api': { target: env.VITE_INVENTARIO_API_URL || 'http://localhost:8081', changeOrigin: true },
        // MessageUcoLab por Kong: el minifront y el cliente de mensajes llaman a /messageucolab en el
        // mismo origen, así el navegador envía la cookie de sesión y no hace falta CORS.
        '/messageucolab': {
          target: env.VITE_MESSAGEUCOLAB_URL || 'http://localhost:8000',
          changeOrigin: true,
          // Para el navegador la llamada es del mismo origen. Si el Origin llegara al backend, este
          // rechazaría con 403 los POST/PUT/DELETE de un origen que no tiene autorizado.
          configure: (proxy) => proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        }
      }
    }
  }
})
