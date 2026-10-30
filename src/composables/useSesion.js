import { ref } from 'vue'
import { adminConfig } from '../messageucolab.js'

// Sesión del componente de seguridad. La cookie es HttpOnly (JavaScript no la lee), así que se
// pregunta a MessageUcoLab quién es el usuario: 200 = sesión activa, 401 = sin sesión.
const usuario = ref(null)
const revisada = ref(false)

export function useSesion() {
  async function revisar() {
    try {
      const res = await fetch('/messageucolab/v1/session/user', {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      })
      // Respuesta: { data: [{ id, email, name }] }
      const json = res.ok ? await res.json() : null
      usuario.value = [json?.data].flat()[0] ?? null
    } catch {
      usuario.value = null
    } finally {
      revisada.value = true
    }
  }

  function iniciarSesion() {
    // Seguridad solo vuelve a las direcciones autorizadas en PDP_LOGIN_ALLOWED_RETURN_ORIGINS
    const url = new URL(adminConfig.loginUrl)
    url.searchParams.set('returnTo', window.location.href)
    window.location.assign(url.href)
  }

  return { usuario, revisada, revisar, iniciarSesion }
}
