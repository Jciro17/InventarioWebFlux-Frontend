<script setup>
import { onMounted, onUnmounted } from 'vue'
import ToastList from './components/ToastList.vue'
import { useSesion } from './composables/useSesion.js'
import { useAvisos } from './composables/useAvisos.js'

const { usuario, revisada, revisar, iniciarSesion } = useSesion()
// Avisos de cambios en los mensajes del ambiente que consume el backend de Inventario
const avisos = useAvisos()

onMounted(() => {
  revisar()
  avisos.escuchar()
})
onUnmounted(avisos.detener)
</script>

<template>
  <nav class="navbar">
    <span class="brand">📦 Inventario UCO</span>
    <RouterLink to="/" class="nav-link" active-class="active">Inventario</RouterLink>
    <RouterLink to="/mensajes" class="nav-link" active-class="active">Mensajes</RouterLink>
    <span v-if="usuario" class="nav-link">● {{ usuario.email || usuario.name || 'Sesión activa' }}</span>
    <a v-else-if="revisada" href="#" class="nav-link" @click.prevent="iniciarSesion">Iniciar sesión</a>
  </nav>
  <main class="page">
    <RouterView />
  </main>
  <ToastList />
</template>
