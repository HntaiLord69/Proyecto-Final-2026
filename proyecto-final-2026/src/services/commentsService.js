import { apiRequest } from './apiClient'

/**
 * 7.1 Obtener todos los comentarios de un post (GET /subforums/:name/posts/:postId/comments)
 * Devuelve un arreglo JSON directo [...] sin paginación, ordenado cronológicamente.
 */
export async function getCommentsByPost(subforumName, postId) {
  return apiRequest(
    `/subforums/${encodeURIComponent(subforumName)}/posts/${encodeURIComponent(postId)}/comments`,
  )
}

/**
 * 7.2 Publicar un comentario en un post (POST /subforums/:name/posts/:postId/comments)
 * Body: { author, content }
 */
export async function createComment(subforumName, postId, { author, content }) {
  return apiRequest(
    `/subforums/${encodeURIComponent(subforumName)}/posts/${encodeURIComponent(postId)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({
        author: author.trim(),
        content: content.trim(),
      }),
    },
  )
}
