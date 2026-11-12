import { reactive, toValue, watch } from 'vue'
import { mensajes as api } from '../api.js'

// Textos de la pantalla. Los resuelve el backend de Inventario con su identidad de servicio:
// el navegador nunca llama a MessageUcoLab ni conoce los IDs de la aplicación o del ambiente.
// Si MessageUcoLab no responde, el backend ya devuelve su texto de respaldo (source "fallback").

// Nunca lanza excepción: si el propio backend no responde, devuelve el código para no romper la pantalla.
export async function obtenerMensaje(code, vars) {
  try {
    return await api.obtener(code, vars)
  } catch (err) {
    return { code, title: code, content: code, source: 'error', error: err.message }
  }
}

// Versión reactiva para plantillas: se vuelve a pedir cuando cambian el código o las variables.
export function useMensaje(code, vars) {
  const mensaje = reactive({ code: toValue(code), title: '', content: '', source: 'loading', error: null })
  watch(
    () => [toValue(code), toValue(vars)],
    async ([actual, variables]) => {
      Object.assign(mensaje, { error: null }, await obtenerMensaje(actual, variables))
    },
    { immediate: true, deep: true }
  )
  return mensaje
}
