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
| Texto que resuelve el backend | Avisos al guardar, eliminar, registrar entradas y salidas | El backend ya responde `{ title, content, source }`; la pantalla solo lo muestra (`ToastList.vue`) |
| Texto que pide la pantalla en un evento | Validación del formulario antes de llamar al backend | `useMensajes().get('MSG_INVALID')` (`InventarioView.vue`) |
| Texto reactivo en la plantilla | Avisos de **Productos por reabastecer** | `useMensaje('MSG_STOCKLOW', () => ({ nombre, cantidad }))` (`AlertaStock.vue`) |
| Administrar los mensajes | Página **Mensajes** | Componente `<MessageUcoLabAdmin>` (`MensajesView.vue`); necesita la sesión de seguridad |
| Revisar de dónde sale cada texto | Botón **Comprobar conexión** | Compara backend y pantalla: MessageUcoLab o respaldo |

La configuración está en `src/messageucolab.js` (IDs, textos de respaldo) y `vite.config.js` (proxy).

## Ejecutar

1. Levanta MessageUcoLab y el componente de seguridad (guía, pasos 0 a 4) y el backend de Inventario
   (`http://localhost:8081`).
2. Copia `.env.example` como `.env.local` y pon el `applicationId` y el `environmentId` de Inventario
   (guía, paso 7).
3. En esta carpeta:
   ```bash
   npm install
   npm run dev
   ```
4. Abre <http://localhost:5177>.

Para iniciar sesión desde esta pantalla, `http://localhost:5177` debe estar en
`PDP_SECURITY_CORS_ALLOWED_ORIGINS` y `PDP_LOGIN_ALLOWED_RETURN_ORIGINS` del `.env` del componente de
seguridad (guía, paso 1).
