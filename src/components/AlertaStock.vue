<script setup>
// Aviso de un producto con pocas unidades. El texto se arma en la pantalla.
defineProps({ producto: { type: Object, required: true } })
</script>

<template>
  <li :class="producto.sinExistencia ? 'qty-zero' : 'qty-low'">
    <template v-if="producto.sinExistencia">{{ producto.nombre }} está agotado.</template>
    <template v-else>Quedan {{ producto.cantidad }} unidades de {{ producto.nombre }}.</template>
  </li>
</template>
