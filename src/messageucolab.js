// Configuración de la página Mensajes (administración de MessageUcoLab con la sesión de una persona).
// Los textos de la pantalla no se configuran aquí: los resuelve el backend de Inventario con su
// identidad de servicio (src/composables/useMensajes.js). Los valores salen de .env.local (ver .env.example).
const env = import.meta.env

export const adminConfig = {
  applicationName: env.VITE_MESSAGEUCOLAB_APPLICATION_NAME || 'Inventario',
  environmentName: env.VITE_MESSAGEUCOLAB_ENVIRONMENT_NAME || 'Develop',
  loginUrl: env.VITE_SECURITY_LOGIN_URL || 'http://localhost:5173/login'
}
