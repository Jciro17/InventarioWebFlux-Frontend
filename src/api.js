// Llamadas al backend de Inventario. Vite reenvía /api a http://localhost:8081 (vite.config.js).
async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`)
  return res.json()
}

export const productos = {
  listar: () => api('GET', '/api/productos'),
  crear: (datos) => api('POST', '/api/productos', datos),
  actualizar: (id, datos) => api('PUT', `/api/productos/${id}`, datos),
  eliminar: (id) => api('DELETE', `/api/productos/${id}`),
  movimiento: (id, tipo, cantidad) => api('POST', `/api/productos/${id}/${tipo}?cantidad=${cantidad}`)
}

// Mensajes que resuelve el backend con su identidad de servicio
export const mensajes = {
  obtener: (code, vars = {}) => {
    const query = new URLSearchParams(vars).toString()
    return api('GET', `/api/mensajes/${encodeURIComponent(code)}${query ? `?${query}` : ''}`)
  },
  estado: () => api('GET', '/api/mensajes/estado'),
  limpiarCache: () => api('POST', '/api/mensajes/limpiar-cache')
}
