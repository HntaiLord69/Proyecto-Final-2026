import { useState, useEffect, useMemo } from 'react'
import ReactionButtons from './ReactionButtons'
import RichContentRenderer from '../ui/RichContentRenderer'
import {
  IconComment,
  IconEdit,
  IconTrash,
  SubforumEmblem,
  UserAvatar,
} from '../ui/ForumIcons'
import { formatDateTime, formatRelativeTime } from '../../utils/formatDate'
import {
  addRecentlyViewedPost,
  computeAuthorRank,
  getSavedAuthor,
  isPostBookmarked,
  isPostRecentlyViewed,
  togglePostBookmark,
} from '../../utils/storage'

export const FLAIR_FILTER_OPTIONS = [
  { id: 'all', label: '✨ Todos' },
  { id: 'media', label: '🖼️ Multimedia' },
  { id: 'tech', label: '💻 Código / Tech' },
  { id: 'question', label: '❓ Preguntas' },
  { id: 'hot', label: '🔥 Destacados' },
]

/**
 * Detecta automáticamente las etiquetas visuales (Post Flairs estilo Reddit)
 * a partir del contenido, título, multimedia y reacciones del post.
 */
export function computePostFlairs(post) {
  if (!post) return []
  const flairs = []
  const titleAndContent = `${post.title || ''} ${post.content || ''}`

  if (/[¿?]/.test(post.title || '')) {
    flairs.push({ id: 'question', label: '❓ Pregunta / Duda', variant: 'flair-cyan' })
  }
  if (post.imageUrl) {
    flairs.push({ id: 'media', label: '🖼️ Multimedia', variant: 'flair-purple' })
  }
  if (
    /```|\b(react|vite|api|backend|frontend|js|javascript|css|html|mod|mods|fps|overclock|codigo|código|bug)\b/i.test(
      titleAndContent,
    )
  ) {
    flairs.push({ id: 'tech', label: '💻 Tech & Dev', variant: 'flair-emerald' })
  }
  if ((post.likes || 0) >= 2 || (post.commentCount || 0) >= 1) {
    flairs.push({ id: 'hot', label: '🔥 Destacado', variant: 'flair-orange' })
  }
  if (flairs.length === 0) {
    flairs.push({ id: 'discussion', label: '💬 Discusión', variant: 'flair-slate' })
  }
  return flairs.slice(0, 3)
}

export function postMatchesFlairFilter(post, filterId = 'all') {
  if (!filterId || filterId === 'all') return true
  const flairs = computePostFlairs(post)
  return flairs.some((f) => f.id === filterId)
}

/**
 * Tarjeta de Post con Glassmorphism Pro, Cursor Spotlight, Post Flairs de Colores,
 * Hover Preview Card para u/autor, Avatares Generativos SVG, Guardados y Compartir.
 *
 * Cumple estrictamente la regla visual de la sección 3 de la API:
 * 1° Primero el TÍTULO (title)
 * 2° Debajo el CONTENIDO EN TEXTO (content)
 * 3° Al final la IMAGEN (imageUrl, si no es null) con manejo de onError y vista ampliada (Lightbox).
 */
export default function PostCard({
  post,
  onOpenDetail,
  onSelectSubforum,
  onSelectAuthor,
  onLike,
  onDislike,
  onEdit,
  onDelete,
  onBookmarkChanged,
  isDetailView = false,
  layout = 'reddit',
}) {
  const [failedImageUrl, setFailedImageUrl] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [saved, setSaved] = useState(() =>
    post ? isPostBookmarked(post.subforum, post.id) : false,
  )
  const [wasViewed, setWasViewed] = useState(() =>
    post ? isPostRecentlyViewed(post.subforum, post.id) : false,
  )
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeAuthor, setActiveAuthor] = useState(getSavedAuthor)
  const [isContentExpanded, setIsContentExpanded] = useState(false)

  useEffect(() => {
    if (post) {
      setSaved(isPostBookmarked(post.subforum, post.id))
      setWasViewed(isPostRecentlyViewed(post.subforum, post.id))
    }
    const onBookmarksUpdate = () => {
      if (post) setSaved(isPostBookmarked(post.subforum, post.id))
    }
    const onRecentViewedUpdate = () => {
      if (post) setWasViewed(isPostRecentlyViewed(post.subforum, post.id))
    }
    const onAuthorUpdate = (e) => setActiveAuthor(e.detail || '')
    window.addEventListener('lcc-bookmarks-changed', onBookmarksUpdate)
    window.addEventListener('lcc-recent-viewed-changed', onRecentViewedUpdate)
    window.addEventListener('lcc-author-changed', onAuthorUpdate)
    return () => {
      window.removeEventListener('lcc-bookmarks-changed', onBookmarksUpdate)
      window.removeEventListener('lcc-recent-viewed-changed', onRecentViewedUpdate)
      window.removeEventListener('lcc-author-changed', onAuthorUpdate)
    }
  }, [post])

  const flairs = useMemo(() => computePostFlairs(post), [post])
  const authorRank = useMemo(
    () =>
      computeAuthorRank({
        netKarma: (post?.likes || 0) - (post?.dislikes || 0),
        postCount: 2,
      }),
    [post],
  )

  if (!post) return null

  const imageBroken = Boolean(post.imageUrl && failedImageUrl === post.imageUrl)
  const wasEdited =
    post.updatedAt && post.createdAt && post.updatedAt !== post.createdAt
  const isCurrentUser =
    Boolean(activeAuthor) &&
    Boolean(post.author) &&
    activeAuthor.trim().toLowerCase() === post.author.trim().toLowerCase()

  const totalVotes = (post.likes || 0) + (post.dislikes || 0)
  const approvalPct =
    totalVotes > 0 ? Math.round(((post.likes || 0) / totalVotes) * 100) : 100
  const readingMinutes = Math.max(
    1,
    Math.ceil(((post.content || '').split(/\s+/).length || 1) / 180),
  )

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  const handleToggleSave = (e) => {
    e.stopPropagation()
    const result = togglePostBookmark(post)
    setSaved(result.saved)
    if (onBookmarkChanged) onBookmarkChanged(result.saved, post)
  }

  const handleShareLink = (e) => {
    e.stopPropagation()
    const deepUrl = `${window.location.origin}${window.location.pathname}#/r/${encodeURIComponent(
      post.subforum,
    )}/posts/${post.id}`
    navigator.clipboard?.writeText(deepUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 1800)
  }

  const handleOpenPost = () => {
    if (!isDetailView && onOpenDetail) {
      addRecentlyViewedPost(post)
      onOpenDetail(post.id)
    }
  }

  return (
    <>
      <article
        className={`post-card spotlight-card layout-${layout} ${
          isDetailView ? 'post-card-detail' : ''
        }`}
        onMouseMove={handleMouseMove}
        onClick={handleOpenPost}
        role={!isDetailView ? 'button' : undefined}
        tabIndex={!isDetailView ? 0 : undefined}
      >
        <div className="post-main-column">
          {/* Cabecera de metadatos: r/subforo + Botón 1-Clic con Hover Card para u/autor + Flairs */}
          <div className="post-meta-bar">
            <div className="post-author-info">
              {post.subforum && (
                <button
                  type="button"
                  className="post-subforum-chip"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onSelectSubforum) onSelectSubforum(post.subforum)
                  }}
                  title={`Ir al subforo r/${post.subforum}`}
                >
                  <SubforumEmblem name={post.subforum} size={22} />
                  <span>r/{post.subforum}</span>
                </button>
              )}

              {/* Contenedor con Hover Preview Card y Acceso 1-Clic al Perfil del Usuario */}
              <div
                className="author-hover-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="author-profile-pill"
                  onClick={() => {
                    if (onSelectAuthor && post.author) onSelectAuthor(post.author)
                  }}
                >
                  <UserAvatar name={post.author} size={22} />
                  <span className="post-author-name">u/{post.author}</span>
                  <span
                    className={`author-rank-micro ${authorRank.className}`}
                    title={`Rango académico: ${authorRank.label}`}
                  >
                    {authorRank.icon}
                  </span>
                  {isCurrentUser && <span className="you-badge">TÚ</span>}
                </button>

                {/* Mini-Tarjeta Flotante de Cristal al pasar el mouse (Hover Preview Card) */}
                <div className="author-hover-card" role="tooltip">
                  <div className="hover-card-top">
                    <UserAvatar name={post.author} size={42} />
                    <div className="hover-card-identity">
                      <strong>u/{post.author}</strong>
                      <span className={`author-rank-badge ${authorRank.className}`}>
                        {authorRank.icon} {authorRank.label}
                      </span>
                    </div>
                  </div>
                  <div className="hover-card-stats">
                    <span>👍 {post.likes} likes en este post</span>
                    <span>•</span>
                    <span>r/{post.subforum}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm hover-card-cta"
                    onClick={() => {
                      if (onSelectAuthor && post.author) onSelectAuthor(post.author)
                    }}
                  >
                    Ver perfil e historial completo →
                  </button>
                </div>
              </div>

              <span className="meta-dot">•</span>
              <span className="post-timestamp" title={formatDateTime(post.createdAt)}>
                {formatRelativeTime(post.createdAt)}
              </span>

              <span className="post-reading-pill">⏱ {readingMinutes} min</span>

              {wasViewed && !isDetailView && (
                <span
                  className="post-viewed-pill"
                  title="Ya abriste esta publicación recientemente"
                >
                  ✓ Visto
                </span>
              )}

              {wasEdited && (
                <span
                  className="post-edited-badge"
                  title={`Editado el ${formatDateTime(post.updatedAt)}`}
                >
                  editado
                </span>
              )}
            </div>

            <div className="post-id-actions" onClick={(e) => e.stopPropagation()}>
              <span className="post-id-tag">#{post.id}</span>
              {onEdit && (
                <button
                  type="button"
                  className="btn-action-mini"
                  onClick={() => onEdit(post)}
                  title="Editar post (PATCH)"
                >
                  <IconEdit size={14} />
                  <span>Editar</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="btn-action-mini btn-action-danger"
                  onClick={() => onDelete(post)}
                  title="Eliminar post (DELETE)"
                >
                  <IconTrash size={14} />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de Etiquetas Visuales de Colores (Post Flairs estilo Reddit) */}
          <div className="post-flairs-row">
            {flairs.map((f) => (
              <span key={f.id} className={`post-flair-pill ${f.variant}`}>
                {f.label}
              </span>
            ))}
          </div>

          {/* 1° PRIMERO EL TÍTULO */}
          <h2 className="post-title">{post.title}</h2>

          {/* 2° DEBAJO EL CONTENIDO EN TEXTO (Con colapsado inteligente para posts largos en el Feed) */}
          {(() => {
            const rawText = post.content || ''
            const isLongPost =
              !isDetailView &&
              (rawText.length > 420 || rawText.split('\n').length > 7)
            const shouldClamp = isLongPost && !isContentExpanded

            return (
              <div className="post-content-wrapper">
                <div
                  className={`post-content ${
                    shouldClamp ? 'post-content-clamped' : ''
                  }`}
                >
                  <RichContentRenderer
                    content={post.content}
                    onSelectSubforum={onSelectSubforum}
                    onSelectAuthor={onSelectAuthor}
                  />
                </div>
                {isLongPost && (
                  <button
                    type="button"
                    className="post-expand-toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsContentExpanded((prev) => !prev)
                    }}
                  >
                    {isContentExpanded
                      ? 'Mostrar menos ↑'
                      : '📖 Leer publicación completa ↓'}
                  </button>
                )}
              </div>
            )
          })()}

          {/* 3° AL FINAL LA IMAGEN (Escenario con fondo desenfocado estilo Reddit + Lightbox + onError) */}
          {post.imageUrl && (
            <div
              className="reddit-media-container"
              onClick={(e) => e.stopPropagation()}
            >
              {!imageBroken ? (
                <div
                  className="reddit-media-stage"
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={post.imageUrl}
                    alt=""
                    aria-hidden="true"
                    className="reddit-media-backdrop"
                  />
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="reddit-media-foreground"
                    loading="lazy"
                    onError={() => setFailedImageUrl(post.imageUrl)}
                  />
                  <button
                    type="button"
                    className="image-zoom-hint"
                    onClick={() => setLightboxOpen(true)}
                  >
                    🔍 Ampliar imagen
                  </button>
                </div>
              ) : (
                <div className="post-image-fallback">
                  <span>🖼️ No se pudo cargar la imagen externa</span>
                  <a
                    href={post.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="fallback-link"
                  >
                    {post.imageUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Barra inferior de píldoras de acción estilo Reddit con Glassmorphism */}
          <div className="post-footer-bar">
            <div className="post-footer-left">
              <ReactionButtons
                likes={post.likes}
                dislikes={post.dislikes}
                onLike={() => onLike(post.id)}
                onDislike={() => onDislike(post.id)}
              />

              <button
                type="button"
                className="reddit-action-pill"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isDetailView && onOpenDetail) onOpenDetail(post.id)
                }}
              >
                <IconComment size={15} />
                <strong>{post.commentCount}</strong>
                <span className="action-pill-text">
                  {post.commentCount === 1 ? 'comentario' : 'comentarios'}
                </span>
              </button>

              <button
                type="button"
                className={`reddit-action-pill ${saved ? 'pill-bookmarked' : ''}`}
                onClick={handleToggleSave}
                title={
                  saved
                    ? 'Quitar de tus publicaciones guardadas'
                    : 'Guardar publicación en Favoritos'
                }
              >
                <span>{saved ? '🔖 Guardado' : '🔖 Guardar'}</span>
              </button>

              <button
                type="button"
                className="reddit-action-pill"
                onClick={handleShareLink}
                title="Copiar enlace directo a esta publicación"
              >
                <span>{copiedLink ? '✓ Copiado' : '🔗 Compartir'}</span>
              </button>

              {totalVotes > 0 && (
                <span
                  className="approval-ratio-pill"
                  title="Porcentaje de likes sobre el total de reacciones"
                >
                  <span className="approval-dot" />
                  {approvalPct}% positivo
                </span>
              )}
            </div>

            <div className="post-footer-right">
              <span className="post-date-exact">{formatDateTime(post.createdAt)}</span>
              {!isDetailView && (
                <span className="post-open-link">Abrir hilo →</span>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Lightbox para ver la imagen del post en tamaño completo */}
      {lightboxOpen && post.imageUrl && !imageBroken && (
        <div
          className="modal-backdrop"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={post.imageUrl} alt={post.title} className="lightbox-img" />
            <div className="lightbox-caption">
              <span>{post.title}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setLightboxOpen(false)}
              >
                Cerrar ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
