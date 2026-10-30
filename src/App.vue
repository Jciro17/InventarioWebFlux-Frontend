<script setup>
import ToastList from './components/ToastList.vue'
</script>

<template>
  <nav class="navbar">
    <span class="brand">📦 Inventario UCO</span>
    <RouterLink to="/" class="nav-link" active-class="active">Inventario</RouterLink>
  </nav>
  <main class="page">
    <RouterView />
  </main>
  <ToastList />
</template>
