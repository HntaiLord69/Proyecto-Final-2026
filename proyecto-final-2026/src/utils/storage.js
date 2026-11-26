const KEYS = {
  AUTHOR: 'lcc_chan_last_author',
  THEME: 'lcc_chan_theme_v2',
  LAYOUT: 'lcc_chan_layout_v2',
  BOOKMARKS: 'lcc_chan_bookmarks_v1',
  RECENT_VIEWED: 'lcc_chan_recent_viewed_v1',
}

export const DEFAULT_API_URL = 'https://157.245.161.37/api'

export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '')
  }
  return DEFAULT_API_URL
}

export function getSavedAuthor() {
  return localStorage.getItem(KEYS.AUTHOR) || ''
}

export function saveAuthor(author) {
  const clean = (author || '').trim()
  if (clean) {
    localStorage.setItem(KEYS.AUTHOR, clean)
  } else {
    localStorage.removeItem(KEYS.AUTHOR)
  }
  window.dispatchEvent(new CustomEvent('lcc-author-changed', { detail: clean }))
}

export function getSavedTheme() {
  return localStorage.getItem(KEYS.THEME) || 'tokyo-night'
}

export function saveTheme(theme) {
  localStorage.setItem(KEYS.THEME, theme)
  document.documentElement.setAttribute('data-theme', theme)
}

export function getSavedLayout() {
  return localStorage.getItem(KEYS.LAYOUT) || 'reddit'
}

export function saveLayout(layout) {
  localStorage.setItem(KEYS.LAYOUT, layout)
}

/**
 * Gestión de Posts Guardados / Favoritos (Bookmarks en localStorage)
 */
export function getSavedBookmarks() {
  try {
    const raw = localStorage.getItem(KEYS.BOOKMARKS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isPostBookmarked(subforum, postId) {
  const list = getSavedBookmarks()
  return list.some(
    (item) => item.subforum === subforum && Number(item.id) === Number(postId),
  )
}

export function togglePostBookmark(post) {
  if (!post || !post.subforum || post.id === undefined) return { saved: false, list: [] }
  const list = getSavedBookmarks()
  const exists = list.some(
    (item) => item.subforum === post.subforum && Number(item.id) === Number(post.id),
  )

  let next
  if (exists) {
    next = list.filter(
      (item) => !(item.subforum === post.subforum && Number(item.id) === Number(post.id)),
    )
  } else {
    next = [post, ...list]
  }

  localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('lcc-bookmarks-changed', { detail: next }))
  return { saved: !exists, list: next }
}


/**
 * Gestión del Historial de Posts Vistos Recientemente (Recently Viewed estilo Reddit)
 */
export function getRecentlyViewedPosts() {
  try {
    const raw = localStorage.getItem(KEYS.RECENT_VIEWED)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isPostRecentlyViewed(subforum, postId) {
  const list = getRecentlyViewedPosts()
  return list.some(
    (item) => item.subforum === subforum && Number(item.id) === Number(postId),
  )
}

export function addRecentlyViewedPost(post) {
  if (!post || !post.subforum || post.id === undefined) return []
  const current = getRecentlyViewedPosts()
  const filtered = current.filter(
    (item) => !(item.subforum === post.subforum && Number(item.id) === Number(post.id)),
  )
  const entry = {
    id: Number(post.id),
    subforum: post.subforum,
    title: post.title || `Post #${post.id}`,
    author: post.author || 'Anónimo',
    imageUrl: post.imageUrl || null,
    likes: post.likes || 0,
    commentCount: post.commentCount || 0,
    viewedAt: new Date().toISOString(),
  }
  const next = [entry, ...filtered].slice(0, 12)
  localStorage.setItem(KEYS.RECENT_VIEWED, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('lcc-recent-viewed-changed', { detail: next }))
  return next
}

export function clearRecentlyViewedPosts() {
  localStorage.removeItem(KEYS.RECENT_VIEWED)
  window.dispatchEvent(new CustomEvent('lcc-recent-viewed-changed', { detail: [] }))
  return []
}

/**
 * Calcula la insignia / rango académico UNISON-LCC según Karma y publicaciones
 */
export function computeAuthorRank({ netKarma = 0, postCount = 1 } = {}) {
  if (netKarma >= 10 || postCount >= 5) {
    return {
      icon: '🦅',
      label: 'Búho Legendario',
      className: 'rank-legendary',
    }
  }
  if (netKarma >= 4 || postCount >= 3) {
    return {
      icon: '💻',
      label: 'Senior Dev LCC',
      className: 'rank-senior',
    }
  }
  if (netKarma >= 1 || postCount >= 2) {
    return {
      icon: '⚡',
      label: 'Búho Activo',
      className: 'rank-active',
    }
  }
  return {
    icon: '🌱',
    label: 'Nuevo Búho',
    className: 'rank-newbie',
  }
}

/**
 * Calcula el tiempo estimado de lectura en minutos
 */
export function estimateReadingTime(title = '', content = '') {
  const full = `${title || ''} ${content || ''}`.trim()
  if (!full) return '1 min'
  const words = full.split(/\s+/).length
  const mins = Math.max(1, Math.ceil(words / 180))
  return `${mins} min`
}


/**
 * Autoguardado de Borradores (Auto-Draft Recovery) para Posts y Comentarios
 */
const DRAFT_POST_KEY = 'lcc_chan_post_draft_v1'

export function getPostDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_POST_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function savePostDraft(draft) {
  try {
    if (!draft || (!draft.title?.trim() && !draft.content?.trim() && !draft.imageUrl?.trim())) {
      localStorage.removeItem(DRAFT_POST_KEY)
      return
    }
    localStorage.setItem(DRAFT_POST_KEY, JSON.stringify(draft))
  } catch {
    // Ignorar si localStorage está lleno
  }
}

export function clearPostDraft() {
  localStorage.removeItem(DRAFT_POST_KEY)
}

export function getCommentDraft(postId) {
  if (!postId) return ''
  return localStorage.getItem(`lcc_chan_comment_draft_${postId}`) || ''
}

export function saveCommentDraft(postId, content) {
  if (!postId) return
  if (!content || !content.trim()) {
    localStorage.removeItem(`lcc_chan_comment_draft_${postId}`)
  } else {
    localStorage.setItem(`lcc_chan_comment_draft_${postId}`, content)
  }
}

export function clearCommentDraft(postId) {
  if (!postId) return
  localStorage.removeItem(`lcc_chan_comment_draft_${postId}`)
}
