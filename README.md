# Inventario UCO — Frontend

Pantalla en **Vue 3 + Vite** de Inventario UCO, integrada con MessageUcoLab mediante el
[minifront-mensajes](https://github.com/Jciro17/minifront-mensajes). Habla con el backend
[InventarioWebFlux](https://github.com/Jciro17/InventarioWebFlux) por `/api` y con MessageUcoLab por
`/messageucolab`.

| Rama | Contenido |
|---|---|
| `develop` | Pantalla integrada con MessageUcoLab y funcionando |
| `test/guide-integration` | Pantalla **sin** integrar: los textos están escritos en el código. Sirve para seguir la guía |

## Cómo usa MessageUcoLab

| Caso | Dónde está | Cómo |
|---|---|---|
| Texto que resuelve el backend | Avisos al guardar, eliminar, registrar entradas y salidas | El backend responde `title` y `content`, con `source` cuando corresponde; la pantalla solo lo muestra (`ToastList.vue`) |
| Texto que pide la pantalla en un evento | Validación del formulario antes de guardar | `obtenerMensaje('MSG_INVALID')` → `GET /api/mensajes/MSG_INVALID` del backend (`InventarioView.vue`) |
| Texto reactivo reutilizable | Componente `AlertaStock.vue`, no montado en la pantalla actual tras retirar el panel de reabastecimiento | `useMensaje('MSG_STOCKLOW', () => ({ nombre, cantidad }))` → `GET /api/mensajes/MSG_STOCKLOW?nombre=…&cantidad=…` |
| Administrar los mensajes | Página **Mensajes** | Componente `<MessageUcoLabAdmin>` (`MensajesView.vue`); necesita la sesión de seguridad |
| Comprobar los mensajes | Botón **Comprobar conexión** | Muestra los mensajes obtenidos de MessageUcoLab o el error HTTP recibido |

El navegador nunca llama a MessageUcoLab para leer textos ni conoce sus IDs: todos los pide al backend de Inventario
(`src/composables/useMensajes.js`), que los resuelve con su identidad de servicio. No hay respaldo local:
los errores HTTP se muestran en la pantalla, sin sustituirlos por textos ni por el código del mensaje.
La página **Mensajes** sí habla con MessageUcoLab, pero con la sesión de la persona (`src/messageucolab.js`, `vite.config.js`).

## Ejecutar

La dependencia `minifront-mensajes` queda fijada al commit publicado
[`f22393d`](https://github.com/Jciro17/minifront-mensajes/commit/f22393d29132b6c8378b2db74e711f737fd16538).
Se descarga por HTTPS; no requiere una copia local del minifront ni seguir una rama cambiante.
`package-lock.json` conserva esa misma revisión para instalaciones reproducibles con `npm ci`.

1. Levanta MessageUcoLab y el componente de seguridad (guía, pasos 0 a 4) y el backend de Inventario
   (`http://localhost:8081`).
2. Copia `.env.example` como `.env.local` (solo nombres y direcciones; no lleva IDs ni secretos).
3. En esta carpeta:
   ```bash
   npm install
   npm run dev
   ```
4. Abre <http://localhost:5177>.

Para iniciar sesión desde esta pantalla, `http://localhost:5177` debe estar en
`PDP_SECURITY_CORS_ALLOWED_ORIGINS` y `PDP_LOGIN_ALLOWED_RETURN_ORIGINS` del `.env` del componente de
seguridad (guía, paso 1).
