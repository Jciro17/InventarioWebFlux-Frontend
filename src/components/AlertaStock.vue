<script setup>
import { useMensaje } from 'minifront-mensajes/vue'

// Aviso de un producto con pocas unidades. El texto viene de MessageUcoLab y se vuelve a armar
// cuando cambian la cantidad o el nombre.
const props = defineProps({ producto: { type: Object, required: true } })

const aviso = useMensaje(
  () => (props.producto.sinExistencia ? 'MSG_AGOTADO' : 'MSG_STOCKLOW'),
  () => ({ nombre: props.producto.nombre, cantidad: String(props.producto.cantidad) })
)
</script>

<template>
  <li :class="producto.sinExistencia ? 'qty-zero' : 'qty-low'" :title="aviso.title">
    {{ aviso.content }}
  </li>
</template>
