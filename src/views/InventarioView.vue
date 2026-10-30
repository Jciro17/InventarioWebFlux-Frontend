<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { productos as api } from '../api.js'
import { useToasts } from '../composables/useToasts.js'
import AlertaStock from '../components/AlertaStock.vue'

const { mostrar } = useToasts()

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
  // Validación en la pantalla, antes de llamar al backend
  if (!form.nombre.trim() || !form.sku.trim() || form.cantidad < 0 || form.stockMinimo < 0) {
    mostrar({ title: 'Datos del producto incompletos', content: 'Revisa nombre, SKU, cantidad y stock mínimo antes de guardar.' })
    return
  }
  try {
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

onMounted(cargar)
</script>

<template>
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
