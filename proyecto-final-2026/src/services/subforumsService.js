import { apiRequest } from './apiClient'

/**
 * 4.1 Listar subforos (GET /subforums)
 * Query params: page, limit, sortBy ('lastActivity' | 'postCount'), order ('desc' | 'asc')
 */
export async function getSubforums({
  page = 1,
  limit = 10,
  sortBy = 'lastActivity',
  order = 'desc',
} = {}) {
  const params = new URLSearchParams()
  if (page) params.append('page', String(page))
  if (limit) params.append('limit', String(limit))
  if (sortBy) params.append('sortBy', sortBy)
  if (order) params.append('order', order)

  return apiRequest(`/subforums?${params.toString()}`)
}

/**
 * 4.2 Crear un subforo (POST /subforums)
 * Body: { name, description }
 */
export async function createSubforum({ name, description }) {
  return apiRequest('/subforums', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      description: description.trim(),
    }),
  })
}

/**
 * 4.3 Obtener un subforo por nombre (GET /subforums/:name)
 */
export async function getSubforumByName(name) {
  return apiRequest(`/subforums/${encodeURIComponent(name)}`)
}

/**
 * 4.4 Editar la descripción de un subforo (PATCH /subforums/:name)
 * Body: { description }
 */
export async function updateSubforumDescription(name, description) {
  return apiRequest(`/subforums/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      description: description.trim(),
    }),
  })
}
