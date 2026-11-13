import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { nextTick, ref, effectScope } from 'vue'
import { productos, mensajes } from '../src/api.js'
import { obtenerMensaje, useMensaje } from '../src/composables/useMensajes.js'

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url)))
const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url)))

test('obtenerMensaje reenvía código y variables y propaga el mismo error', async () => {
  const error = new Error('backend no disponible')
  const original = mensajes.obtener
  const llamadas = []
  mensajes.obtener = async (...args) => { llamadas.push(args); throw error }
  try {
    await assert.rejects(obtenerMensaje('MSG_X', { nombre: 'Lápiz' }), (actual) => actual === error)
    assert.deepEqual(llamadas, [['MSG_X', { nombre: 'Lápiz' }]])
  } finally {
    mensajes.obtener = original
  }
})

test('useMensaje recorre loading, éxito, error y limpia su watch al parar el scope', async () => {
  const codigo = ref('A')
  const vars = ref({ cantidad: '2' })
  const original = mensajes.obtener
  const respuestas = []
  mensajes.obtener = (code, values) => new Promise((resolve, reject) => respuestas.push({ code, values, resolve, reject }))
  const scope = effectScope()
  let mensaje
  try {
    scope.run(() => { mensaje = useMensaje(codigo, vars) })
    assert.equal(mensaje.source, 'loading')
    await nextTick()
    assert.deepEqual([respuestas[0].code, respuestas[0].values], ['A', { cantidad: '2' }])
    respuestas[0].resolve({ title: 'Listo', content: 'Contenido', source: 'api' })
    await new Promise((resolve) => setImmediate(resolve))
    assert.deepEqual([mensaje.title, mensaje.content, mensaje.source], ['Listo', 'Contenido', 'api'])

    codigo.value = 'B'
    await nextTick()
    assert.equal(mensaje.source, 'loading')
    respuestas[1].reject(new Error('falló B'))
    await new Promise((resolve) => setImmediate(resolve))
    assert.deepEqual([mensaje.source, mensaje.error], ['error', 'falló B'])

    vars.value = { cantidad: '3' }
    await nextTick()
    assert.deepEqual([respuestas[2].code, respuestas[2].values], ['B', { cantidad: '3' }])
    const cantidadAntesDeParar = respuestas.length
    scope.stop()
    codigo.value = 'C'
    await nextTick()
    assert.equal(respuestas.length, cantidadAntesDeParar)
  } finally {
    scope.stop()
    mensajes.obtener = original
  }
})

test('useMensaje ignora la respuesta obsoleta al cambiar código', async () => {
  const code = ref('viejo')
  const original = mensajes.obtener
  const pendientes = []
  mensajes.obtener = (actual) => new Promise((resolve) => pendientes.push({ actual, resolve }))
  const scope = effectScope()
  try {
    const mensaje = scope.run(() => useMensaje(code, {}))
    await nextTick()
    code.value = 'nuevo'
    await nextTick()
    pendientes[0].resolve({ title: 'Antiguo', content: 'Viejo', source: 'api' })
    pendientes[1].resolve({ title: 'Nuevo', content: 'Actual', source: 'api' })
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(mensaje.title, 'Nuevo')
    assert.equal(mensaje.content, 'Actual')
  } finally {
    scope.stop()
    mensajes.obtener = original
  }
})

test('API conserva el texto del error HTTP y codifica ruta y variables', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async (path, options) => {
    requests.push([path, options])
    return { ok: false, status: 503, text: async () => 'servicio caído' }
  }
  try {
    await assert.rejects(mensajes.obtener('MSG/ERROR', { nombre: 'Ana María' }), /503 servicio caído/)
    assert.equal(requests[0][0], '/api/mensajes/MSG%2FERROR?nombre=Ana+Mar%C3%ADa')
    await assert.rejects(productos.listar(), /503 servicio caído/)
    assert.equal(requests[1][0], '/api/productos')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('dependencia minifront apunta al mismo SHA HTTPS en manifest y lock, sin fuentes locales', () => {
  const expected = 'git+https://github.com/Jciro17/minifront-mensajes.git#f22393d29132b6c8378b2db74e711f737fd16538'
  assert.equal(manifest.dependencies['minifront-mensajes'], expected)
  assert.equal(lock.packages[''].dependencies['minifront-mensajes'], expected)
  assert.equal(lock.packages['node_modules/minifront-mensajes'].resolved, expected)
  assert.equal(/^(file:|ssh:)|\.tgz(?:$|\?)/i.test(lock.packages['node_modules/minifront-mensajes'].resolved), false)
  assert.equal(Object.values(lock.packages).some(({ resolved = '' }) => /^(file:|ssh:)/i.test(resolved)), false)
})
