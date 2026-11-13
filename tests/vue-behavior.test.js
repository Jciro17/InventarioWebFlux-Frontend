import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createSSRApp, toRaw } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { useToasts } from '../src/composables/useToasts.js'

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const viewUrl = new URL('../src/views/InventarioView.vue', import.meta.url)
const apiStubUrl = dataModule(`
  export const calls = []
  export const productos = {
    listar: async () => { calls.push(['listar']); return [] },
    crear: async (...args) => { calls.push(['crear', ...args]); return globalThis.__inventarioTest.createResult() },
    actualizar: async (...args) => { calls.push(['actualizar', ...args]); return globalThis.__inventarioTest.updateResult() },
    eliminar: async (...args) => { calls.push(['eliminar', ...args]) },
    movimiento: async (...args) => { calls.push(['movimiento', ...args]) }
  }
  export const mensajes = { estado: async () => [], limpiarCache: async () => {} }
`)
const messageStubUrl = dataModule(`
  export async function obtenerMensaje() {
    return globalThis.__inventarioTest.validationResult()
  }
`)
const vueStubUrl = dataModule(`
  export * from ${JSON.stringify(import.meta.resolve('vue'))}
  export const onMounted = () => {}
`)

async function loadViewSetup() {
  const source = await readFile(viewUrl, 'utf8')
  const { descriptor, errors } = parse(source, { filename: viewUrl.pathname })
  assert.deepEqual(errors, [])
  const compiled = compileScript(descriptor, { id: 'inventario-test' }).content
    .replaceAll("from 'vue'", `from '${vueStubUrl}'`)
    .replaceAll('from "vue"', `from '${vueStubUrl}'`)
    .replaceAll("from '../api.js'", `from '${apiStubUrl}'`)
    .replaceAll("from '../composables/useMensajes.js'", `from '${messageStubUrl}'`)
    .replaceAll("from '../composables/useToasts.js'", `from '${import.meta.resolve('../src/composables/useToasts.js')}'`)
  return import(dataModule(compiled))
}

async function setupView(config) {
  globalThis.__inventarioTest = config
  const module = await loadViewSetup()
  return module.default.setup({}, { expose() {} })
}

async function apiCalls() {
  return (await import(apiStubUrl)).calls
}

function clearToasts() {
  const { toasts } = useToasts()
  toRaw(toasts).splice(0)
  return toasts
}

async function runWithFakeTimers(action) {
  const originalTimer = globalThis.setTimeout
  globalThis.setTimeout = () => 0
  try {
    return await action()
  } finally {
    globalThis.setTimeout = originalTimer
    delete globalThis.__inventarioTest
    clearToasts()
  }
}

async function renderComponent(file, dependency, exportedName, injectedState, props = {}) {
  globalThis.__inventarioUiTest = injectedState
  const source = await readFile(new URL(file, import.meta.url), 'utf8')
  const { descriptor, errors } = parse(source, { filename: file })
  assert.deepEqual(errors, [])
  const dependencyUrl = dataModule(`export const ${exportedName} = () => globalThis.__inventarioUiTest`)
  const compiled = compileScript(descriptor, { id: file, inlineTemplate: true }).content
    .replaceAll("from 'vue'", `from '${import.meta.resolve('vue')}'`)
    .replaceAll('from "vue"', `from '${import.meta.resolve('vue')}'`)
    .replaceAll(`from '${dependency}'`, `from '${dependencyUrl}'`)
  const component = await import(dataModule(compiled))
  return renderToString(createSSRApp(component.default, props))
}

test('guardar captura rechazo de validación y no crea ni actualiza producto', async () => {
  const toasts = clearToasts()
  await runWithFakeTimers(async () => {
    const calls = await apiCalls()
    calls.length = 0
    const vm = await setupView({
      validationResult: async () => { throw new Error('validación no disponible') },
      createResult: () => ({ title: 'inesperado', content: 'inesperado' }),
      updateResult: () => ({ title: 'inesperado', content: 'inesperado' })
    })
    await vm.guardar()
    assert.deepEqual(toasts.map(({ title, content }) => [title, content]), [['Error', 'validación no disponible']])
    assert.equal(calls.some(([name]) => ['crear', 'actualizar'].includes(name)), false)
    assert.equal(vm.form.nombre, '')
  })
})

test('guardar acepta MessageDetails sin source, notifica, limpia y recarga tras crear', async () => {
  const toasts = clearToasts()
  await runWithFakeTimers(async () => {
    const calls = await apiCalls()
    calls.length = 0
    const vm = await setupView({
      validationResult: async () => ({ title: 'Inválido', content: 'Revisar datos' }),
      createResult: () => ({ title: 'Creado', content: 'Producto guardado' }),
      updateResult: () => ({ title: 'Actualizado', content: 'Producto editado' })
    })
    vm.form.nombre = '  Mouse  '
    vm.form.sku = '  M-1 '
    vm.form.cantidad = 4
    await vm.guardar()
    assert.deepEqual(toRaw(toasts).map(({ title, content, source }) => [title, content, source]), [['Creado', 'Producto guardado', undefined]])
    assert.deepEqual([vm.form.nombre, vm.form.sku, vm.editandoId.value], ['', '', null])
    assert.deepEqual(calls.map(([name]) => name), ['crear', 'listar'])
    assert.deepEqual(calls[0][1], { nombre: 'Mouse', sku: 'M-1', cantidad: 4, stockMinimo: 5 })
  })
})

test('guardar muestra error HTTP sin fabricar éxito, recargar ni reintentar', async () => {
  const toasts = clearToasts()
  await runWithFakeTimers(async () => {
    const calls = await apiCalls()
    calls.length = 0
    const vm = await setupView({
      validationResult: async () => ({ title: 'Inválido', content: 'Revisar datos' }),
      createResult: () => { throw new Error('503 backend caído') },
      updateResult: () => { throw new Error('503 backend caído') }
    })
    vm.form.nombre = 'Mouse'
    vm.form.sku = 'M-1'
    await vm.guardar()
    assert.deepEqual(toasts.map(({ title, content }) => [title, content]), [['Error', '503 backend caído']])
    assert.equal(vm.form.nombre, 'Mouse')
    assert.equal(calls.filter(([name]) => name === 'crear').length, 1)
    assert.equal(calls.filter(([name]) => name === 'listar').length, 0)
  })
})

test('ToastList etiqueta solo source api y presenta fallback de error como error', async () => {
  try {
    const apiToast = await renderComponent('../src/components/ToastList.vue', '../composables/useToasts.js', 'useToasts', {
      toasts: [{ id: 1, title: 'Guardado', content: 'Correcto', source: 'api' }]
    })
    assert.match(apiToast, /MessageUcoLab/)
    assert.match(apiToast, /Guardado/)

    const errorToast = await renderComponent('../src/components/ToastList.vue', '../composables/useToasts.js', 'useToasts', {
      toasts: [
        { id: 2, title: 'Error', content: '503 backend caído', source: 'error' },
        { id: 3, title: 'Mensaje local', content: 'Texto alternativo' }
      ]
    })
    assert.match(errorToast, /503 backend caído/)
    assert.match(errorToast, /Mensaje local/)
    assert.doesNotMatch(errorToast, /toast-source|MessageUcoLab/)
  } finally {
    delete globalThis.__inventarioUiTest
  }
})

test('AlertaStock representa el error recibido en lugar del contenido', async () => {
  try {
    const html = await renderComponent('../src/components/AlertaStock.vue', '../composables/useMensajes.js', 'useMensaje', {
      error: 'No se pudo resolver el mensaje',
      title: 'Contenido de respaldo',
      content: 'Texto que no debe ocultar el error'
    }, { producto: { sinExistencia: false, nombre: 'Mouse', cantidad: 2 } })
    assert.match(html, /No se pudo resolver el mensaje/)
    assert.doesNotMatch(html, /Texto que no debe ocultar el error/)
    assert.match(html, /title="No se pudo resolver el mensaje"/)
  } finally {
    delete globalThis.__inventarioUiTest
  }
})
