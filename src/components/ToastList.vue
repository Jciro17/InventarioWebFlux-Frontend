<script setup>
import { useToasts } from '../composables/useToasts.js'

const { toasts } = useToasts()
</script>

<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div v-for="t in toasts" :key="t.id" class="toast">
      <strong>{{ t.title }}</strong>
      <span>{{ t.content }}</span>
    </div>
  </TransitionGroup>
</template>
