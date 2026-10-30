<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useMensajes } from 'minifront-mensajes/vue'
import { mensajes as mensajesApi, productos as api } from '../api.js'
import { useToasts } from '../composables/useToasts.js'
import { CODIGOS } from '../messageucolab.js'
import AlertaStock from '../components/AlertaStock.vue'

const { mostrar } = useToasts()
const mensajes = useMensajes()
const estado = ref(null)

const lista = ref([])
const vacio = () => ({ nombre: '', sku: '', cantidad: 0, stockMinimo: 5 })
const form = reactive(vacio())
const editandoId = ref(null)
const modal = reactive({ abierto: false, id: null, tipo: 'entrada', cantidad: 1 })

const conAlerta = computed(() => lista.value.filter((p) => p.stockBajo || p.sinExistencia))

function error(err) {
  mostrar({ title: 'Error', content: err.message })
}

async function cargar() {
  try {
    lista.value = await api.listar()
  } catch (err) {
    error(err)
  }
}

function limpiar() {
  Object.assign(form, vacio())
  editandoId.value = null
}

function editar(p) {
  Object.assign(form, { nombre: p.nombre, sku: p.sku, cantidad: p.cantidad, stockMinimo: p.stockMinimo })
  editandoId.value = p.id
}

async function guardar() {
  // Validación en la pantalla, antes de llamar al backend: el texto lo pide el front a MessageUcoLab
  if (!form.nombre.trim() || !form.sku.trim() || form.cantidad < 0 || form.stockMinimo < 0) {
    mostrar(await mensajes.get('MSG_INVALID'))
    return
  }
  try {
    // Las demás respuestas ya traen el texto de MessageUcoLab: lo resuelve el backend
    const datos = { ...form, nombre: form.nombre.trim(), sku: form.sku.trim() }
    mostrar(editandoId.value ? await api.actualizar(editandoId.value, datos) : await api.crear(datos))
    limpiar()
    await cargar()
  } catch (err) {
    error(err)
  }
}

async function eliminar(p) {
  if (!confirm(`¿Eliminar ${p.nombre}?`)) return
  try {
    mostrar(await api.eliminar(p.id))
    await cargar()
  } catch (err) {
    error(err)
  }
}

function abrirModal(p, tipo) {
  Object.assign(modal, { abierto: true, id: p.id, tipo, cantidad: 1 })
}

async function confirmarMovimiento() {
  modal.abierto = false
  try {
    mostrar(await api.movimiento(modal.id, modal.tipo, Math.max(1, modal.cantidad || 1)))
    await cargar()
  } catch (err) {
    error(err)
  }
}

// Muestra de dónde sale cada texto, en el backend y en el front: MessageUcoLab o el respaldo
async function comprobar() {
  estado.value = { cargando: true, filas: [] }
  mensajes.clearCache()
  let backend = []
  let errorBackend = ''
  try {
    backend = await mensajesApi.estado()
  } catch (err) {
    errorBackend = err.message
  }
  const filas = []
  for (const code of CODIGOS) {
    const delBack = backend.find((m) => m.code === code)
    const delFront = await mensajes.get(code)
    filas.push({
      code,
      title: delFront.title,
      backend: delBack ? delBack.source : null,
      front: delFront.source,
      error: delBack?.error || delFront.error?.message || errorBackend
    })
  }
  estado.value = { cargando: false, filas }
}

async function limpiarCache() {
  mensajes.clearCache()
  try {
    await mensajesApi.limpiarCache()
    mostrar({ title: 'Caché limpiada', content: 'Los próximos textos se piden de nuevo a MessageUcoLab.' })
  } catch (err) {
    error(err)
  }
}

const origen = (source) => (source === 'fallback' ? 'Respaldo' : source ? 'MessageUcoLab' : '—')

onMounted(cargar)
</script>

<template>
  <section v-if="estado" class="msg-status-panel">
    <div class="section-header">
      <h3>Mensajes de esta aplicación</h3>
      <button class="btn btn-ghost btn-sm" @click="estado = null">Cerrar</button>
    </div>
    <p v-if="estado.cargando" class="muted">Comprobando…</p>
    <table v-else class="tabla">
      <thead><tr><th>Código</th><th>Título</th><th>Backend</th><th>Front</th><th>Error</th></tr></thead>
      <tbody>
        <tr v-for="f in estado.filas" :key="f.code">
          <td><code>{{ f.code }}</code></td>
          <td>{{ f.title }}</td>
          <td><span v-if="f.backend" :class="['badge', f.backend === 'fallback' ? 'badge-warning' : 'badge-ok']">{{ origen(f.backend) }}</span><span v-else class="muted">Solo en el front</span></td>
          <td><span :class="['badge', f.front === 'fallback' ? 'badge-warning' : 'badge-ok']">{{ origen(f.front) }}</span></td>
          <td class="error-cell">{{ f.error }}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section v-if="conAlerta.length" class="card alertas">
    <h2>Productos por reabastecer</h2>
    <ul>
      <AlertaStock v-for="p in conAlerta" :key="p.id" :producto="p" />
    </ul>
  </section>

  <section class="card form-card">
    <h2>{{ editandoId ? 'Editar producto' : 'Nuevo producto' }}</h2>
    <form class="form-grid" novalidate @submit.prevent="guardar">
      <div class="field">
        <label for="prod-nombre">Nombre</label>
        <input id="prod-nombre" v-model="form.nombre" type="text" placeholder="Mouse inalámbrico" />
      </div>
      <div class="field">
        <label for="prod-sku">SKU</label>
        <input id="prod-sku" v-model="form.sku" type="text" placeholder="MOUSE-001" />
      </div>
      <div class="field">
        <label for="prod-cantidad">Cantidad</label>
        <input id="prod-cantidad" v-model.number="form.cantidad" type="number" min="0" />
      </div>
      <div class="field">
        <label for="prod-stockmin">Stock mínimo</label>
        <input id="prod-stockmin" v-model.number="form.stockMinimo" type="number" min="0" />
      </div>
      <div class="field field-actions">
        <button type="submit" class="btn btn-primary">Guardar</button>
        <button v-if="editandoId" type="button" class="btn btn-ghost" @click="limpiar">Cancelar</button>
      </div>
    </form>
  </section>

  <section class="card">
    <div class="section-header">
      <h2>Productos</h2>
      <div class="acciones">
        <button class="btn btn-ghost btn-sm" @click="comprobar">🔄 Comprobar conexión</button>
        <button class="btn btn-ghost btn-sm" @click="limpiarCache">🗑 Limpiar caché</button>
      </div>
    </div>
    <table class="tabla">
      <thead>
        <tr><th>Nombre</th><th>SKU</th><th>Cantidad</th><th>Mínimo</th><th>Estado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        <tr v-for="p in lista" :key="p.id">
          <td>{{ p.nombre }}</td>
          <td><code>{{ p.sku }}</code></td>
          <td :class="{ 'qty-zero': p.sinExistencia, 'qty-low': p.stockBajo && !p.sinExistencia }">{{ p.cantidad }}</td>
          <td>{{ p.stockMinimo }}</td>
          <td>
            <span v-if="p.sinExistencia" class="badge badge-danger">Sin stock</span>
            <span v-else-if="p.stockBajo" class="badge badge-warning">Stock bajo</span>
            <span v-else class="badge badge-ok">OK</span>
          </td>
          <td class="acciones">
            <button class="btn btn-xs" title="Editar" @click="editar(p)">✏</button>
            <button class="btn btn-xs btn-success" title="Registrar entrada" @click="abrirModal(p, 'entrada')">+</button>
            <button class="btn btn-xs btn-warning" title="Registrar salida" @click="abrirModal(p, 'salida')">-</button>
            <button class="btn btn-xs btn-danger" title="Eliminar" @click="eliminar(p)">🗑</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <div v-if="modal.abierto" class="modal" @click.self="modal.abierto = false">
    <div class="modal-box">
      <h3>{{ modal.tipo === 'salida' ? 'Registrar salida' : 'Registrar entrada' }}</h3>
      <div class="field">
        <label for="modal-cantidad">{{ modal.tipo === 'salida' ? 'Unidades a restar' : 'Unidades a agregar' }}</label>
        <input id="modal-cantidad" v-model.number="modal.cantidad" type="number" min="1" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" @click="confirmarMovimiento">Confirmar</button>
        <button class="btn btn-ghost" @click="modal.abierto = false">Cancelar</button>
      </div>
    </div>
  </div>
</template>
