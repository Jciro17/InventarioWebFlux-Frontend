import test from 'node:test'
import assert from 'node:assert/strict'
import { useAvisos } from '../src/composables/useAvisos.js'
import { useToasts } from '../src/composables/useToasts.js'

// EventSource falso: guarda los manejadores para disparar eventos a mano.
class FakeEventSource {
  static instancias = []
  constructor(url) {
    this.url = url
    this.oyentes = {}
    this.cerrada = false
    FakeEventSource.instancias.push(this)
  }
  addEventListener(tipo, fn) { this.oyentes[tipo] = fn }
  emitir(tipo, data) { this.oyentes[tipo]?.({ data }) }
  close() { this.cerrada = true }
}

test('un aviso SSE se muestra como notificación y detener cierra el canal', () => {
  globalThis.EventSource = FakeEventSource
  const { toasts } = useToasts()
  toasts.splice(0)
  const avisos = useAvisos('/api/avisos')
  try {
    avisos.escuchar()
    const fuente = FakeEventSource.instancias.at(-1)
    assert.equal(fuente.url, '/api/avisos')

    fuente.emitir('aviso', JSON.stringify({ title: 'Mensaje actualizado', content: 'MSG_PRODSAVED: Producto guardado' }))
    assert.equal(toasts.length, 1)
    assert.equal(toasts[0].title, '🔔 Mensaje actualizado')
    assert.equal(toasts[0].content, 'MSG_PRODSAVED: Producto guardado')

    fuente.emitir('aviso', 'no-es-json')
    assert.equal(toasts.length, 1, 'un aviso ilegible no agrega notificaciones')

    avisos.escuchar()
    assert.equal(FakeEventSource.instancias.at(-1), fuente, 'escuchar dos veces no abre otro canal')
  } finally {
    avisos.detener()
    assert.equal(FakeEventSource.instancias.at(-1).cerrada, true)
    toasts.splice(0)
    delete globalThis.EventSource
  }
})
