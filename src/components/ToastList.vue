<script setup>
import { useToasts } from '../composables/useToasts.js'

const { toasts } = useToasts()
</script>

<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div v-for="t in toasts" :key="t.id" class="toast">
      <strong>{{ t.title }}</strong>
      <span>{{ t.content }}</span>
      <!-- source lo agregan el backend (ResolvedMessage) y el cliente de mensajes del front -->
      <small v-if="t.source === 'api'" class="toast-source">
        ✓ MessageUcoLab
      </small>
    </div>
  </TransitionGroup>
</template>
