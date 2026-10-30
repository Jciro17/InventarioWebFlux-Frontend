// Configuración de MessageUcoLab para esta pantalla. Los valores salen de .env.local (ver .env.example).
const env = import.meta.env

export const mensajesConfig = {
  // Vite reenvía /messageucolab a MessageUcoLab (vite.config.js)
  apiBaseUrl: '/messageucolab',
  // Con los dos IDs el front usa la ruta pública: no necesita que el usuario inicie sesión
  applicationId: env.VITE_MESSAGEUCOLAB_APPLICATION_ID,
  environmentId: env.VITE_MESSAGEUCOLAB_ENVIRONMENT_ID,
  // Textos de respaldo: los que estaban escritos en la pantalla, con los mismos marcadores {…}
  fallbacks: {
    MSG_INVALID: {
      title: 'Datos del producto incompletos',
      content: 'Revisa nombre, SKU, cantidad y stock mínimo antes de guardar.'
    },
    MSG_STOCKLOW: { title: 'Stock bajo', content: 'Quedan {cantidad} unidades de {nombre}.' },
    MSG_AGOTADO: { title: 'Producto agotado', content: '{nombre} está agotado.' }
  },
  onError: (error, code) => console.warn(`Mensaje ${code} desde el respaldo:`, error.message)
}

// Administración de mensajes (página Mensajes)
export const adminConfig = {
  applicationName: env.VITE_MESSAGEUCOLAB_APPLICATION_NAME || 'Inventario UCO',
  environmentName: env.VITE_MESSAGEUCOLAB_ENVIRONMENT_NAME || 'Develop',
  loginUrl: env.VITE_SECURITY_LOGIN_URL || 'http://localhost:5173/login'
}

// Códigos que revisa el botón "Comprobar conexión"
export const CODIGOS = ['MSG_PRODSAVED', 'MSG_PRODUPD', 'MSG_PRODDEL', 'MSG_STOCKLOW', 'MSG_NOSTOCK', 'MSG_INVALID', 'MSG_AGOTADO']
