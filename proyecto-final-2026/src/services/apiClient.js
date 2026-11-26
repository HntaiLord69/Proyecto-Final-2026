import { getApiBaseUrl } from '../utils/storage'

export const API_URL = getApiBaseUrl()

/**
 * Cliente HTTP centralizado conectado directamente al servidor Backend:
 * https://157.245.161.37/api
 *
 * Cumple con todas las reglas de la especificación LCC-chan:
 * - Agrega Content-Type: application/json en POST y PATCH cuando se envía cuerpo.
 * - Maneja 204 No Content en DELETE sin llamar a response.json().
 * - Estandariza los errores { error: { code, message, details } }.
 */
export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = {
    ...(options.headers || {}),
  }

  if ((method === 'POST' || method === 'PATCH') && options.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    method,
    headers,
  })

  // DELETE devuelve 204 No Content (sin cuerpo JSON)
  if (response.status === 204) {
    return null
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const errorMessage =
      data?.error?.message || `Error HTTP ${response.status}: No se pudo completar la petición.`
    const err = new Error(errorMessage)
    err.status = response.status
    err.code = data?.error?.code || 'API_ERROR'
    err.details = data?.error?.details || []
    throw err
  }

  return data
}
