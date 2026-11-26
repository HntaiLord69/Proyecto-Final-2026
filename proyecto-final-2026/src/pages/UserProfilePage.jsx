import { useState, useEffect, useCallback } from 'react'
import { getSubforums } from '../services/subforumsService'
import {
  getPostsBySubforum,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
} from '../services/postsService'
import PostCard from '../components/posts/PostCard'
import PostFormModal from '../components/posts/PostFormModal'
import Modal from '../components/ui/Modal'
import ErrorAlert from '../components/ui/ErrorAlert'
import EmptyState from '../components/ui/EmptyState'
import {
  CommunityBannerArt,
  IconComment,
  IconFlame,
  IconImage,
  IconSparkles,
  IconUpvote,
  SubforumEmblem,
  UserAvatar,
} from '../components/ui/ForumIcons'
import { formatDateTime, formatRelativeTime } from '../utils/formatDate'
import { computeAuthorRank } from '../utils/storage'

/**
 * Página de Perfil e Historial de Publicaciones de Usuario (#/u/:author).
 * Accesible con 1 clic sobre cualquier nombre de autor en posts, comentarios,
 * barra superior o panel derecho.
 */
export default function UserProfilePage({
  authorName,
  onBackHome,
  onSelectSubforum,
  onOpenPostDetail,
  onSelectAuthor,
  refreshTrigger,
  layout,
  onNotify,
}) {
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros interactivos del historial del usuario
  const [selectedSubforum, setSelectedSubforum] = useState('all')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'likes' | 'comments'
  const [mediaFilter, setMediaFilter] = useState('all') // 'all' | 'image' | 'text'

  // Edición y eliminación directa desde el historial del perfil
  const [editingPost, setEditingPost] = useState(null)
  const [deletingPost, setDeletingPost] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchUserHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Obtener todos los subforos del servidor
      const subRes = await getSubforums({
        page: 1,
        limit: 50,
        sortBy: 'lastActivity',
        order: 'desc',
      })
      const subList = subRes.data || []

      // 2. Consultar los posts de cada subforo y filtrar por el autor (case-insensitive)
      const allPostResponses = await Promise.all(
        subList.map((s) =>
          getPostsBySubforum(s.name, {
            page: 1,
            limit: 50,
            sortBy: 'date',
            order: 'desc',
          }).catch(() => ({ data: [] })),
        ),
      )

      const targetLower = (authorName || '').trim().toLowerCase()
      const matchedPosts = allPostResponses
        .flatMap((res) => res.data || [])
        .filter((p) => (p.author || '').trim().toLowerCase() === targetLower)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      setUserPosts(matchedPosts)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [authorName])

  useEffect(() => {
    setSelectedSubforum('all')
    fetchUserHistory()
  }, [fetchUserHistory, refreshTrigger])

  const handleLike = async (post) => {
    try {
      const res = await likePost(post.subforum, post.id)
      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === post.id && p.subforum === post.subforum
            ? { ...p, likes: res.likes, dislikes: res.dislikes }
            : p,
        ),
      )
    } catch (err) {
      setError(err)
    }
  }

  const handleDislike = async (post) => {
    try {
      const res = await dislikePost(post.subforum, post.id)
      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === post.id && p.subforum === post.subforum
            ? { ...p, likes: res.likes, dislikes: res.dislikes }
            : p,
        ),
      )
    } catch (err) {
      setError(err)
    }
  }

  const handleEditPost = async (changes) => {
    if (!editingPost) return
    const updated = await updatePost(editingPost.subforum, editingPost.id, changes)
    setUserPosts((prev) =>
      prev.map((p) =>
        p.id === updated.id && p.subforum === updated.subforum ? updated : p,
      ),
    )
    if (onNotify) onNotify(`Publicación #${updated.id} actualizada`)
  }

  const handleDeletePost = async () => {
    if (!deletingPost) return
    try {
      setDeleteLoading(true)
      await deletePost(deletingPost.subforum, deletingPost.id)
      setDeletingPost(null)
      await fetchUserHistory()
      if (onNotify) onNotify('Publicación eliminada del historial')
    } catch (err) {
      setError(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Estadísticas y métricas calculadas del perfil del usuario
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likes || 0), 0)
  const totalDislikes = userPosts.reduce((acc, p) => acc + (p.dislikes || 0), 0)
  const netKarma = totalLikes - totalDislikes
  const totalCommentsReceived = userPosts.reduce(
    (acc, p) => acc + (p.commentCount || 0),
    0,
  )
  const totalVotes = totalLikes + totalDislikes
  const approvalRate =
    totalVotes > 0 ? Math.round((totalLikes / totalVotes) * 100) : 100
  const authorRank = computeAuthorRank({
    netKarma,
    postCount: userPosts.length,
  })

  // Subforos únicos donde ha publicado este usuario
  const activeCommunitiesMap = userPosts.reduce((acc, p) => {
    acc[p.subforum] = (acc[p.subforum] || 0) + 1
    return acc
  }, {})
  const activeCommunities = Object.entries(activeCommunitiesMap).sort(
    (a, b) => b[1] - a[1],
  )

  const latestPostDate = userPosts[0]?.createdAt || null
  const firstPostDate = userPosts[userPosts.length - 1]?.createdAt || null

  const filteredPosts = userPosts
    .filter((p) => {
      if (selectedSubforum !== 'all' && p.subforum !== selectedSubforum) {
        return false
      }
      if (mediaFilter === 'image' && !p.imageUrl) return false
      if (mediaFilter === 'text' && p.imageUrl) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0)
      if (sortBy === 'comments') {
        return (b.commentCount || 0) - (a.commentCount || 0)
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  return (
    <div className="page-container">
      {/* Migas de pan */}
      <div className="subforum-hero-breadcrumbs">
        <button type="button" className="btn-breadcrumb" onClick={onBackHome}>
          ← Volver al Feed Principal
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Perfil de Usuario</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">u/{authorName}</span>
      </div>

      {/* Tarjeta Hero Glassmorphic del Perfil del Usuario con Arte Vectorial Generativo */}
      <section className="profile-hero-card spotlight-card border-beam-card animate-stagger">
        <div className="profile-cover-banner">
          <CommunityBannerArt seed={authorName} />
          <div className="profile-cover-pattern" />
        </div>

        <div className="profile-hero-body">
          <div className="profile-identity-row">
            <div className="profile-avatar-xl">
              <UserAvatar name={authorName} size={74} />
              <span className="profile-online-dot" title="Perfil activo" />
            </div>

            <div className="profile-title-block">
              <div className="profile-name-row">
                <h1 className="profile-username">u/{authorName}</h1>
                <span className={`author-rank-badge ${authorRank.className}`}>
                  {authorRank.icon} {authorRank.label}
                </span>
                <span className="profile-role-badge">
                  <IconSparkles size={13} /> Autor de LCC-chan
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}#/u/${encodeURIComponent(
                      authorName,
                    )}`
                    navigator.clipboard?.writeText(url)
                    if (onNotify) onNotify(`🔗 Enlace al perfil u/${authorName} copiado`)
                  }}
                >
                  🔗 Compartir Perfil
                </button>
              </div>
              <p className="profile-bio-meta">
                {latestPostDate ? (
                  <>
                    Última publicación {formatRelativeTime(latestPostDate)} • Primera
                    actividad: {formatDateTime(firstPostDate)}
                  </>
                ) : (
                  'Perfil de autor en la comunidad abierta LCC-chan'
                )}
              </p>
            </div>
          </div>

          {/* Tarjetas KPI de Karma e Historial del Usuario */}
          <div className="profile-kpi-grid">
            <div className="profile-kpi-card">
              <div className="profile-kpi-icon kpi-accent">
                <IconFlame size={18} />
              </div>
              <div>
                <strong className="profile-kpi-value">
                  {netKarma >= 0 ? `+${netKarma}` : netKarma}
                </strong>
                <span className="profile-kpi-label">Karma Neto</span>
              </div>
            </div>

            <div className="profile-kpi-card">
              <div className="profile-kpi-icon kpi-primary">📝</div>
              <div>
                <strong className="profile-kpi-value">{userPosts.length}</strong>
                <span className="profile-kpi-label">Publicaciones</span>
              </div>
            </div>

            <div className="profile-kpi-card">
              <div className="profile-kpi-icon kpi-success">
                <IconUpvote size={18} />
              </div>
              <div>
                <strong className="profile-kpi-value">
                  {totalLikes}{' '}
                  <small className="kpi-sub-pct">({approvalRate}%)</small>
                </strong>
                <span className="profile-kpi-label">Likes recibidos</span>
              </div>
            </div>

            <div className="profile-kpi-card">
              <div className="profile-kpi-icon kpi-secondary">
                <IconComment size={18} />
              </div>
              <div>
                <strong className="profile-kpi-value">
                  {totalCommentsReceived}
                </strong>
                <span className="profile-kpi-label">Comentarios en sus posts</span>
              </div>
            </div>
          </div>

          {/* Comunidades donde ha participado este usuario */}
          {activeCommunities.length > 0 && (
            <div className="profile-communities-bar">
              <span className="profile-communities-label">
                Comunidades donde publica:
              </span>
              <div className="profile-communities-chips">
                <button
                  type="button"
                  className={`filter-chip ${
                    selectedSubforum === 'all' ? 'active' : ''
                  }`}
                  onClick={() => setSelectedSubforum('all')}
                >
                  Todas ({userPosts.length})
                </button>
                {activeCommunities.map(([subName, count]) => (
                  <button
                    key={subName}
                    type="button"
                    className={`filter-chip profile-sub-chip ${
                      selectedSubforum === subName ? 'active' : ''
                    }`}
                    onClick={() =>
                      setSelectedSubforum((prev) =>
                        prev === subName ? 'all' : subName,
                      )
                    }
                  >
                    <SubforumEmblem name={subName} size={18} />
                    <span>r/{subName}</span>
                    <span className="chip-count">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Barra de Filtros del Historial de Publicaciones */}
      <div className="filters-panel">
        <div className="filters-row-top">
          <div className="profile-history-heading">
            <h3>
              🗂️ Historial de Publicaciones de <span>u/{authorName}</span>
            </h3>
            <span className="rail-badge">
              {filteredPosts.length} de {userPosts.length} posts
            </span>
          </div>

          <div className="filter-sort-group">
            <div className="filter-chips">
              <button
                type="button"
                className={`filter-chip ${mediaFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMediaFilter('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`filter-chip ${mediaFilter === 'image' ? 'active' : ''}`}
                onClick={() => setMediaFilter('image')}
              >
                <IconImage size={13} /> Con imagen
              </button>
              <button
                type="button"
                className={`filter-chip ${mediaFilter === 'text' ? 'active' : ''}`}
                onClick={() => setMediaFilter('text')}
              >
                Solo texto
              </button>
            </div>

            <select
              className="select-input select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Ordenar historial del usuario"
            >
              <option value="date">🕒 Más recientes primero</option>
              <option value="likes">🔥 Más votados (Likes)</option>
              <option value="comments">💬 Más comentados</option>
            </select>
          </div>
        </div>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* Stream del Historial de Publicaciones del Usuario */}
      {loading ? (
        <div className="loading-stack">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon="👤"
          title={`No hay publicaciones de u/${authorName} con estos filtros`}
          description="Prueba seleccionando todas las comunidades o vuelve al feed principal."
          actionLabel="Ver todas las publicaciones"
          onAction={() => {
            setSelectedSubforum('all')
            setMediaFilter('all')
          }}
        />
      ) : (
        <div className="posts-feed">
          {filteredPosts.map((post, idx) => (
            <div
              key={`${post.subforum}-${post.id}`}
              className="animate-stagger"
              style={{ '--stagger': idx }}
            >
              <PostCard
                post={post}
                layout={layout}
                onSelectSubforum={onSelectSubforum}
                onSelectAuthor={onSelectAuthor}
                onOpenDetail={(postId) => onOpenPostDetail(post.subforum, postId)}
                onLike={() => handleLike(post)}
                onDislike={() => handleDislike(post)}
                onEdit={(p) => setEditingPost(p)}
                onDelete={(p) => setDeletingPost(p)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal para editar post desde el Perfil del Usuario */}
      <PostFormModal
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        subforumName={editingPost?.subforum || ''}
        initialPost={editingPost}
        onSubmit={handleEditPost}
      />

      {/* Modal para eliminar post desde el Perfil del Usuario */}
      <Modal
        isOpen={Boolean(deletingPost)}
        onClose={() => setDeletingPost(null)}
        title="Confirmar eliminación de publicación"
        subtitle="Esta acción eliminará permanentemente el post y sus comentarios."
        size="sm"
      >
        {deletingPost && (
          <div className="form-stack">
            <div className="confirm-post-box">
              <strong>{deletingPost.title}</strong>
              <span>
                En r/{deletingPost.subforum} • Publicado por u/{deletingPost.author}
              </span>
            </div>
            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingPost(null)}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeletePost}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Eliminando...' : 'Sí, eliminar post'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
