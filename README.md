# Inventario UCO — Frontend

Pantalla en **Vue 3 + Vite** de Inventario UCO. Habla con el backend
[InventarioWebFlux](https://github.com/Jciro17/InventarioWebFlux) por `/api`.

## Ejecutar

1. Levanta el backend de Inventario (`http://localhost:8081`).
2. En esta carpeta:
   ```bash
   npm install
   npm run dev
   ```
3. Abre <http://localhost:5177>.

Si el backend usa otra dirección, crea un archivo `.env.local` con
`VITE_INVENTARIO_API_URL=http://localhost:<puerto>`.
