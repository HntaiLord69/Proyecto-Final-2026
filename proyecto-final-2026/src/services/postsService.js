import { apiRequest } from './apiClient'

/**
 * 5.1 Listar posts de un subforo (GET /subforums/:name/posts)
 * Query params: page, limit, afterDate, beforeDate, hasImage, sortBy, order
 */
export async function getPostsBySubforum(subforumName, filtros = {}) {
  const params = new URLSearchParams()

  if (filtros.page) params.append('page', String(filtros.page))
  if (filtros.limit) params.append('limit', String(filtros.limit))
  if (filtros.afterDate) params.append('afterDate', filtros.afterDate)
  if (filtros.beforeDate) params.append('beforeDate', filtros.beforeDate)
  if (filtros.hasImage !== undefined && filtros.hasImage !== '') {
    params.append('hasImage', String(filtros.hasImage))
  }
  if (filtros.sortBy) params.append('sortBy', filtros.sortBy)
  if (filtros.order) params.append('order', filtros.order)

  return apiRequest(
    `/subforums/${encodeURIComponent(subforumName)}/posts?${params.toString()}`,
  )
}

/**
 * 5.2 Crear un post en un subforo (POST /subforums/:name/posts)
 * Body: { title, content, author, imageUrl }
 */
export async function createPost(subforumName, { title, content, author, imageUrl }) {
  const cleanImage = imageUrl && imageUrl.trim() ? imageUrl.trim() : null
  return apiRequest(`/subforums/${encodeURIComponent(subforumName)}/posts`, {
    method: 'POST',
    body: JSON.stringify({
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      imageUrl: cleanImage,
    }),
  })
}

/**
 * 5.3 Obtener el detalle de un post (GET /subforums/:name/posts/:postId)
 */
export async function getPostById(subforumName, postId) {
  return apiRequest(
    `/subforums/${encodeURIComponent(subforumName)}/posts/${encodeURIComponent(postId)}`,
  )
}

/**
 * 5.4 Editar parcialmente un post (PATCH /subforums/:name/posts/:postId)
 * Solo envía campos permitidos: title, content, imageUrl
 * Nunca envía campos protegidos (author, subforum, likes, dislikes, commentCount, createdAt).
 */
export async function updatePost(subforumName, postId, changes = {}) {
  const payload = {}
  if (changes.title !== undefined) payload.title = changes.title.trim()
  if (changes.content !== undefined) payload.content = changes.content.trim()
  if (changes.imageUrl !== undefined) {
    payload.imageUrl =
      changes.imageUrl && changes.imageUrl.trim() ? changes.imageUrl.trim() : null
  }

  return apiRequest(
    `/subforums/${encodeURIComponent(subforumName)}/posts/${encodeURIComponent(postId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

/**
 * 5.5 Eliminar un post (DELETE /subforums/:name/posts/:postId)
 * Devuelve 204 No Content (null)
 */
export async function deletePost(subforumName, postId) {
  return apiRequest(
    `/subforums/${encodeURIComponent(subforumName)}/posts/${encodeURIComponent(postId)}`,
    {
      method: 'DELETE',
    },
  )
}

/**
 * 6.1 Dar like a un post (POST /subforums/:name/posts/:postId/like)
 * No lleva cuerpo JSON. Devuelve { id, likes, dislikes }
 */
export async function likePost(subforumName, postId) {
  return apiRequest(
    `/subforums/${encodeURIComponent(subforumName)}/posts/${encodeURIComponent(postId)}/like`,
    {
      method: 'POST',
    },
  )
}

/**
 * 6.2 Dar dislike a un post (POST /subforums/:name/posts/:postId/dislike)
 * No lleva cuerpo JSON. Devuelve { id, likes, dislikes }
 */
export async function dislikePost(subforumName, postId) {
  return apiRequest(
    `/subforums/${encodeURIComponent(subforumName)}/posts/${encodeURIComponent(postId)}/dislike`,
    {
      method: 'POST',
    },
  )
}
