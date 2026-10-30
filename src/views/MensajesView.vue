<script setup>
import { MessageUcoLabAdmin } from 'minifront-mensajes/vue'
import { adminConfig } from '../messageucolab.js'
import { useSesion } from '../composables/useSesion.js'

const { revisar } = useSesion()
</script>

<template>
  <section class="card">
    <h2>Administración de mensajes</h2>
    <p class="muted">
      Es el minifront de MessageUcoLab montado dentro de Inventario: lista, crea, edita, traduce e
      importa por Excel los mensajes de esta aplicación. Necesita la sesión del componente de
      seguridad; si no la tienes, el mismo minifront te lleva a iniciarla.
    </p>
    <MessageUcoLabAdmin
      class="admin-mensajes"
      :application-name="adminConfig.applicationName"
      :environment-name="adminConfig.environmentName"
      :login-url="adminConfig.loginUrl"
      title="Mensajes del Inventario"
      lock-context
      :allow-application-creation="false"
      @unauthorized="revisar"
    />
  </section>
</template>
