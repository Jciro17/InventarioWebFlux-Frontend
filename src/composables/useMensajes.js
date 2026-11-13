import { reactive, toValue, watch } from 'vue'
import { mensajes as api } from '../api.js'

// Textos de la pantalla. Los resuelve el backend de Inventario con su identidad de servicio:
// el navegador nunca llama a MessageUcoLab ni conoce los IDs de la aplicación o del ambiente.
// Los errores se propagan al consumidor, sin sustituir el mensaje por un texto local ni por su código.
export async function obtenerMensaje(code, vars) {
  return api.obtener(code, vars)
}

// Versión reactiva para plantillas: se vuelve a pedir cuando cambian el código o las variables.
export function useMensaje(code, vars) {
  const mensaje = reactive({ code: toValue(code), title: '', content: '', source: 'loading', error: null })
  watch(
    () => [toValue(code), toValue(vars)],
    async ([actual, variables], previous, onCleanup) => {
      let active = true
      onCleanup(() => { active = false })
      Object.assign(mensaje, { code: actual, title: '', content: '', source: 'loading', error: null })
      try {
        const result = await obtenerMensaje(actual, variables)
        if (active) Object.assign(mensaje, { error: null }, result)
      } catch (err) {
        if (active) Object.assign(mensaje, { source: 'error', error: err.message })
      }
    },
    { immediate: true, deep: true }
  )
  return mensaje
}
