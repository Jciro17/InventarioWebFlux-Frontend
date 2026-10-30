import { reactive } from 'vue'

// Avisos compartidos por toda la aplicación: cualquier vista los agrega y App.vue los muestra.
const toasts = reactive([])
let siguienteId = 0

export function useToasts() {
  function mostrar(aviso) {
    const toast = { id: siguienteId++, ...aviso }
    toasts.push(toast)
    setTimeout(() => {
      const i = toasts.findIndex((t) => t.id === toast.id)
      if (i >= 0) toasts.splice(i, 1)
    }, 4500)
  }
  return { toasts, mostrar }
}
