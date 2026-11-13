import { useToasts } from './useToasts.js'

// Avisos en tiempo real de MessageUcoLab. El backend de Inventario escucha Pulsar (solo los avisos del ambiente
// de su identidad de servicio) y los reenvía por GET /api/avisos como eventos SSE "aviso". Mostrarlos es opcional:
// el backend los recibe igual; esta pantalla los muestra como notificación.
const SILENCIO_MAXIMO_MS = 25_000 // el backend envía un "latido" cada 10 s
const ESPERA_RECONEXION_MS = 3_000

export function useAvisos(url = '/api/avisos') {
  const { mostrar } = useToasts()
  let fuente = null
  let vigilante = null
  let reconexion = null
  let activo = false

  // Un proxy puede dejar abierta la conexión aunque el backend se reinicie: si no llega nada en un rato,
  // se cierra y se vuelve a abrir.
  function vigilar() {
    clearTimeout(vigilante)
    vigilante = setTimeout(reconectar, SILENCIO_MAXIMO_MS)
  }

  function reconectar() {
    cerrarFuente()
    if (activo) reconexion = setTimeout(abrir, ESPERA_RECONEXION_MS)
  }

  function abrir() {
    fuente = new EventSource(url)
    fuente.onopen = vigilar
    fuente.addEventListener('latido', vigilar)
    fuente.addEventListener('aviso', (evento) => {
      vigilar()
      try {
        const aviso = JSON.parse(evento.data)
        mostrar({ title: `🔔 ${aviso.title}`, content: aviso.content, source: 'evento' }, 8000)
      } catch {
        // Un aviso ilegible no rompe la pantalla.
      }
    })
    fuente.onerror = reconectar
    vigilar()
  }

  function cerrarFuente() {
    clearTimeout(vigilante)
    if (fuente) fuente.close()
    fuente = null
  }

  function escuchar() {
    if (activo || typeof EventSource === 'undefined') return
    activo = true
    abrir()
  }

  function detener() {
    activo = false
    clearTimeout(reconexion)
    cerrarFuente()
  }

  return { escuchar, detener }
}
