<script setup>
import { useMensaje } from '../composables/useMensajes.js'

// Aviso de un producto con pocas unidades. El texto lo resuelve el backend de Inventario con
// MessageUcoLab y se vuelve a pedir cuando cambian la cantidad o el nombre.
const props = defineProps({ producto: { type: Object, required: true } })

const aviso = useMensaje(
  () => (props.producto.sinExistencia ? 'MSG_AGOTADO' : 'MSG_STOCKLOW'),
  () => ({ nombre: props.producto.nombre, cantidad: String(props.producto.cantidad) })
)
</script>

<template>
  <li :class="producto.sinExistencia ? 'qty-zero' : 'qty-low'" :title="aviso.error || aviso.title">
    {{ aviso.error || aviso.content }}
  </li>
</template>
