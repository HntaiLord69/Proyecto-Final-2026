import { useState, useEffect, useCallback, useMemo } from 'react'
import { getSubforums } from '../services/subforumsService'
import {
  getPostsBySubforum,
  createPost,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
} from '../services/postsService'
import SubforumCard from '../components/subforums/SubforumCard'
import PostCard, {
  FLAIR_FILTER_OPTIONS,
  postMatchesFlairFilter,
} from '../components/posts/PostCard'
import PostFormModal from '../components/posts/PostFormModal'
import QuickPostComposer from '../components/posts/QuickPostComposer'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import ErrorAlert from '../components/ui/ErrorAlert'
import EmptyState from '../components/ui/EmptyState'
import {
  CommunityBannerArt,
  HeroArtwork,
  IconFlame,
  IconPlus,
  IconSparkles,
  SubforumEmblem,
  UserAvatar,
} from '../components/ui/ForumIcons'
import { addRecentlyViewedPost, getSavedBookmarks } from '../utils/storage'

export default function HomePage({
  activeTab = 'for-you',
  onChangeTab,
  searchQuery = '',
  onSelectSubforum,
  onOpenPostDetail,
  onSelectAuthor,
  onOpenCreateSubforum,
  refreshTrigger,
  layout,
  onLayoutChange,
  onSubforumsLoaded,
  onRecentPostsLoaded,
  onNotify,
}) {
  const [subforums, setSubforums] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [bookmarks, setBookmarks] = useState(getSavedBookmarks)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState('lastActivity')
  const [order, setOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editingPost, setEditingPost] = useState(null)
  const [deletingPost, setDeletingPost] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeFlairFilter, setActiveFlairFilter] = useState('all')
  const [visiblePostsCount, setVisiblePostsCount] = useState(10)
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchHomeData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true)
        } else {
          setIsSyncing(true)
        }
        setError(null)
        const response = await getSubforums({ page, limit, sortBy, order })
        const list = response.data || []
        setSubforums(list)
        setPagination(response.pagination || null)
        if (onSubforumsLoaded) onSubforumsLoaded(list)

        if (list.length > 0) {
          const postLists = await Promise.all(
            list.map((s) =>
              getPostsBySubforum(s.name, {
                page: 1,
                limit: 20,
                sortBy: 'date',
                order: 'desc',
              }).catch(() => ({ data: [] })),
            ),
          )
          const merged = postLists
            .flatMap((r) => r.data || [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          setRecentPosts(merged)
          if (onRecentPostsLoaded) onRecentPostsLoaded(merged)
        } else {
          setRecentPosts([])
          if (onRecentPostsLoaded) onRecentPostsLoaded([])
        }
      } catch (err) {
        if (!silent) setError(err)
      } finally {
        setLoading(false)
        setIsSyncing(false)
      }
    },
    [page, limit, sortBy, order, onSubforumsLoaded, onRecentPostsLoaded],
  )

  useEffect(() => {
    fetchHomeData(false)
  }, [fetchHomeData, refreshTrigger])

  // Auto-sincronización silenciosa cada 25s para sesiones con múltiples usuarios conectados
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchHomeData(true)
      }
    }, 25000)
    return () => clearInterval(interval)
  }, [fetchHomeData])

  useEffect(() => {
    const onBookmarksUpdate = () => setBookmarks(getSavedBookmarks())
    window.addEventListener('lcc-bookmarks-changed', onBookmarksUpdate)
    return () => window.removeEventListener('lcc-bookmarks-changed', onBookmarksUpdate)
  }, [])

  const handleQuickPublishFromHome = async (targetSubforum, payload) => {
    await createPost(targetSubforum, payload)
    await fetchHomeData()
    if (onNotify) onNotify(`Publicado en r/${targetSubforum}`)
  }

  const handleLikeFromHome = async (post) => {
    try {
      const res = await likePost(post.subforum, post.id)
      setRecentPosts((prev) => {
        const next = prev.map((p) =>
          p.id === post.id && p.subforum === post.subforum
            ? { ...p, likes: res.likes, dislikes: res.dislikes }
            : p,
        )
        if (onRecentPostsLoaded) onRecentPostsLoaded(next)
        return next
      })
    } catch (err) {
      setError(err)
    }
  }

  const handleDislikeFromHome = async (post) => {
    try {
      const res = await dislikePost(post.subforum, post.id)
      setRecentPosts((prev) => {
        const next = prev.map((p) =>
          p.id === post.id && p.subforum === post.subforum
            ? { ...p, likes: res.likes, dislikes: res.dislikes }
            : p,
        )
        if (onRecentPostsLoaded) onRecentPostsLoaded(next)
        return next
      })
    } catch (err) {
      setError(err)
    }
  }

  const handleEditPostFromHome = async (changes) => {
    if (!editingPost) return
    const updated = await updatePost(editingPost.subforum, editingPost.id, changes)
    setRecentPosts((prev) =>
      prev.map((p) =>
        p.id === updated.id && p.subforum === updated.subforum ? updated : p,
      ),
    )
    if (onNotify) onNotify(`Post #${updated.id} actualizado`)
  }

  const handleDeletePostFromHome = async () => {
    if (!deletingPost) return
    try {
      setDeleteLoading(true)
      await deletePost(deletingPost.subforum, deletingPost.id)
      setDeletingPost(null)
      await fetchHomeData()
      if (onNotify) onNotify('Publicación eliminada')
    } catch (err) {
      setError(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPostsCount = subforums.reduce((acc, s) => acc + (s.postCount || 0), 0)
  const uniqueAuthors = Array.from(
    new Set(recentPosts.map((p) => p.author).filter(Boolean)),
  )

  const q = searchQuery.trim().toLowerCase()

  const sourcePosts = activeTab === 'saved' ? bookmarks : recentPosts

  // Posts en Tendencia (Top 4 por relevancia y multimedia estilo Reddit)
  const trendingPosts = useMemo(() => {
    return [...recentPosts]
      .sort((a, b) => {
        const scoreA =
          (a.likes || 0) * 3 + (a.commentCount || 0) * 2 + (a.imageUrl ? 2 : 0)
        const scoreB =
          (b.likes || 0) * 3 + (b.commentCount || 0) * 2 + (b.imageUrl ? 2 : 0)
        return scoreB - scoreA
      })
      .slice(0, 4)
  }, [recentPosts])

  // Contadores en vivo por categoría de Flair
  const flairCounts = useMemo(() => {
    const counts = { all: sourcePosts.length }
    for (const opt of FLAIR_FILTER_OPTIONS) {
      if (opt.id === 'all') continue
      counts[opt.id] = sourcePosts.filter((p) =>
        postMatchesFlairFilter(p, opt.id),
      ).length
    }
    return counts
  }, [sourcePosts])

  const displayedPosts = [...sourcePosts]
    .filter((p) => {
      if (!postMatchesFlairFilter(p, activeFlairFilter)) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.subforum.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (activeTab === 'popular') {
        return b.likes - a.likes
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  const filteredSubforums = q
    ? subforums.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    : subforums

  return (
    <div className="page-container">
      {/* Hero Banner Glassmorphic con Ilustración Vectorial Flotante y Border Beam */}
      <section className="welcome-banner spotlight-card border-beam-card animate-stagger">
        <div className="welcome-banner-content">
          <div className="welcome-badges-row">
            <span className="welcome-pill">
              <IconSparkles size={14} /> LCC-chan Glass Forum
            </span>
            <span className="welcome-stat-chip">
              <strong>{pagination?.total ?? subforums.length}</strong> comunidades
            </span>
            <span className="welcome-stat-chip">
              <strong>{totalPostsCount}</strong> publicaciones
            </span>
            {uniqueAuthors.length > 0 && (
              <span className="welcome-stat-chip">
                <strong>{uniqueAuthors.length}</strong> autores activos
              </span>
            )}
          </div>

          <h1 className="welcome-title">
            Explora comunidades, perfiles de usuario y discusiones en tiempo real
          </h1>
          <p className="welcome-subtitle">
            Publica sin cuentas ni contraseñas. Haz clic en cualquier subforo{' '}
            <code>r/nombre</code> o en el perfil de cualquier autor{' '}
            <code>u/usuario</code> para ver su historial completo de publicaciones.
          </p>

          <div className="welcome-cta-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenCreateSubforum}
            >
              <IconPlus size={17} />
              <span>Crear Nuevo Subforo</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                onChangeTab &&
                onChangeTab(activeTab === 'explore' ? 'for-you' : 'explore')
              }
            >
              <IconFlame size={17} />
              <span>
                {activeTab === 'explore'
                  ? 'Ver Feed de Publicaciones'
                  : 'Directorio de Comunidades'}
              </span>
            </button>
          </div>
        </div>

        <div className="welcome-artwork-col">
          <HeroArtwork />
        </div>
      </section>

      {/* Carrusel Superior de "En Tendencia Hoy" (Trending Highlights estilo Reddit) */}
      {trendingPosts.length > 0 && activeTab !== 'explore' && (
        <section
          className="trending-carousel-section animate-stagger"
          aria-label="Publicaciones en tendencia"
        >
          <div className="trending-section-header">
            <div className="trending-title-group">
              <IconFlame size={16} />
              <span>En Tendencia Hoy en LCC-chan</span>
            </div>
            <span className="trending-sub-hint">
              Haz clic en una tarjeta para abrir la conversación
            </span>
          </div>

          <div className="trending-cards-grid">
            {trendingPosts.map((tPost) => (
              <div
                key={`trend-${tPost.subforum}-${tPost.id}`}
                className="trending-highlight-card"
                onClick={() => {
                  addRecentlyViewedPost(tPost)
                  if (onOpenPostDetail) {
                    onOpenPostDetail(tPost.subforum, tPost.id)
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addRecentlyViewedPost(tPost)
                    if (onOpenPostDetail) {
                      onOpenPostDetail(tPost.subforum, tPost.id)
                    }
                  }
                }}
              >
                <div className="trending-card-bg" aria-hidden="true">
                  {tPost.imageUrl ? (
                    <img
                      src={tPost.imageUrl}
                      alt=""
                      className="trending-card-bg-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <CommunityBannerArt seed={`${tPost.subforum}-${tPost.id}`} />
                  )}
                  <div className="trending-card-scrim" />
                </div>

                <div className="trending-card-content">
                  <div className="trending-card-top">
                    <span
                      className="trending-sub-chip"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onSelectSubforum) onSelectSubforum(tPost.subforum)
                      }}
                    >
                      <SubforumEmblem name={tPost.subforum} size={18} />
                      <span>r/{tPost.subforum}</span>
                    </span>
                    <span className="trending-score-pill">
                      ▲ {tPost.likes || 0} • 💬 {tPost.commentCount || 0}
                    </span>
                  </div>

                  <h3 className="trending-card-title">{tPost.title}</h3>

                  <div className="trending-card-author">
                    <UserAvatar name={tPost.author} size={18} />
                    <span>u/{tPost.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cinta Horizontal Glassmorphic de Comunidades y Perfiles Destacados */}
      {subforums.length > 0 && (
        <div className="community-ribbon" aria-label="Acceso rápido a comunidades">
          {subforums.map((sub) => (
            <button
              key={sub.name}
              type="button"
              className="ribbon-pill"
              onClick={() => onSelectSubforum(sub.name)}
            >
              <SubforumEmblem name={sub.name} size={28} />
              <div className="ribbon-pill-text">
                <strong>r/{sub.name}</strong>
                <span>{sub.postCount} posts</span>
              </div>
            </button>
          ))}
          <button
            type="button"
            className="ribbon-pill ribbon-pill-add"
            onClick={onOpenCreateSubforum}
          >
            <IconPlus size={16} />
            <span>Nueva comunidad</span>
          </button>
        </div>
      )}

      {/* Compositor Rápido en la parte superior del muro */}
      {subforums.length > 0 && (
        <QuickPostComposer
          subforums={subforums}
          onPublish={handleQuickPublishFromHome}
        />
      )}

      {/* Barra de pestañas estilo Reddit Glass: For You | Popular | Communities */}
      <div className="glass-feed-topbar">
        <div className="reddit-feed-tabs">
          <button
            type="button"
            className={`reddit-feed-tab ${activeTab === 'for-you' ? 'active' : ''}`}
            onClick={() => onChangeTab && onChangeTab('for-you')}
          >
            ✨ Para Ti<span className="hide-mobile"> (Feed Global)</span>
          </button>
          <button
            type="button"
            className={`reddit-feed-tab ${activeTab === 'popular' ? 'active' : ''}`}
            onClick={() => onChangeTab && onChangeTab('popular')}
          >
            🔥 Más Votados
          </button>
          <button
            type="button"
            className={`reddit-feed-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => onChangeTab && onChangeTab('saved')}
          >
            🔖 Guardados ({bookmarks.length})
          </button>
          <button
            type="button"
            className={`reddit-feed-tab ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => onChangeTab && onChangeTab('explore')}
          >
            🌐 Comunidades ({pagination?.total ?? subforums.length})
          </button>
        </div>

        <div className="reddit-view-selector">
          <button
            type="button"
            className="reddit-view-btn"
            onClick={() => {
              fetchHomeData(true)
              if (onNotify) onNotify('🔄 Feed sincronizado con el servidor')
            }}
            disabled={isSyncing || loading}
            title="Sincronizar nuevas publicaciones y votos del servidor"
          >
            {isSyncing ? '⏳ Sincronizando...' : '🔄 Actualizar'}
          </button>
          <button
            type="button"
            className={`reddit-view-btn ${layout === 'reddit' ? 'active' : ''}`}
            onClick={() => onLayoutChange && onLayoutChange('reddit')}
            title="Vista de tarjetas completas"
          >
            ▤ Tarjetas
          </button>
          <button
            type="button"
            className={`reddit-view-btn ${layout === 'compact' ? 'active' : ''}`}
            onClick={() => onLayoutChange && onLayoutChange('compact')}
            title="Vista compacta"
          >
            ☰ Compacto
          </button>
        </div>
      </div>

      {/* Barra de Filtro Rápido por Etiqueta Visual (Flair Filter Chips) */}
      {(activeTab === 'for-you' ||
        activeTab === 'popular' ||
        activeTab === 'saved') && (
        <div
          className="flair-filter-bar"
          role="toolbar"
          aria-label="Filtrar publicaciones por categoría"
        >
          <span className="flair-filter-label">Filtrar por tipo:</span>
          <div className="flair-filter-chips">
            {FLAIR_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`flair-filter-chip ${
                  activeFlairFilter === opt.id ? 'active' : ''
                }`}
                onClick={() => setActiveFlairFilter(opt.id)}
              >
                <span>{opt.label}</span>
                <span className="flair-chip-count">
                  {flairCounts[opt.id] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* VISTA 1, 2 y 3: FEED DE POSTS ("Para Ti", "Más Votados" y "Guardados") */}
      {(activeTab === 'for-you' || activeTab === 'popular' || activeTab === 'saved') && (
        <>
          {loading ? (
            <div className="loading-stack">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : displayedPosts.length === 0 ? (
            <EmptyState
              icon={activeTab === 'saved' ? '🔖' : '📭'}
              title={
                activeTab === 'saved'
                  ? 'Aún no tienes publicaciones guardadas'
                  : 'No hay publicaciones para mostrar'
              }
              description={
                activeTab === 'saved'
                  ? 'Haz clic en el botón "🔖 Guardar" de cualquier publicación para coleccionarla aquí.'
                  : 'Sé el primero en publicar usando la barra superior.'
              }
              actionLabel={
                activeTab === 'saved' ? 'Ir al Feed Principal' : 'Explorar subforos'
              }
              onAction={() =>
                onChangeTab &&
                onChangeTab(activeTab === 'saved' ? 'for-you' : 'explore')
              }
            />
          ) : (
            <div className="posts-feed">
              {displayedPosts.slice(0, visiblePostsCount).map((post, idx) => (
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
                    onOpenDetail={(postId) =>
                      onOpenPostDetail(post.subforum, postId)
                    }
                    onLike={() => handleLikeFromHome(post)}
                    onDislike={() => handleDislikeFromHome(post)}
                    onEdit={(p) => setEditingPost(p)}
                    onDelete={(p) => setDeletingPost(p)}
                  />
                </div>
              ))}

              {displayedPosts.length > visiblePostsCount && (
                <button
                  type="button"
                  className="btn btn-secondary load-more-feed-btn"
                  onClick={() => setVisiblePostsCount((prev) => prev + 10)}
                >
                  Cargar más publicaciones (quedan{' '}
                  {displayedPosts.length - visiblePostsCount}) ↓
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* VISTA 3: DIRECTORIO DE COMUNIDADES / SUBFOROS (GET /subforums) */}
      {activeTab === 'explore' && (
        <section className="home-section">
          <div className="filters-panel">
            <div className="filters-row-top">
              <strong style={{ fontSize: '0.92rem' }}>
                Directorio de Subforos ({pagination?.total ?? subforums.length})
              </strong>

              <div className="toolbar-controls">
                <label htmlFor="subforum-sort" className="filter-inline-label">
                  Ordenar por:
                </label>
                <select
                  id="subforum-sort"
                  className="select-input select-sm"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="lastActivity">Última actividad</option>
                  <option value="postCount">Cantidad de posts</option>
                </select>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                    setPage(1)
                  }}
                >
                  {order === 'desc' ? '↓ Descendente' : '↑ Ascendente'}
                </button>

                <select
                  className="select-input select-sm"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  aria-label="Subforos por página"
                >
                  <option value={5}>5 por pág.</option>
                  <option value={10}>10 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : filteredSubforums.length === 0 ? (
            <EmptyState
              icon="🌐"
              title="No se encontraron subforos"
              description="Crea un nuevo subforo para iniciar una comunidad."
              actionLabel="+ Crear Subforo"
              onAction={onOpenCreateSubforum}
            />
          ) : (
            <>
              <div className="subforums-grid">
                {filteredSubforums.map((sub, idx) => (
                  <div
                    key={sub.name}
                    className="animate-stagger"
                    style={{ '--stagger': idx }}
                  >
                    <SubforumCard
                      subforum={sub}
                      onSelect={onSelectSubforum}
                      layout={layout}
                    />
                  </div>
                ))}
              </div>

              <Pagination
                pagination={pagination}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </>
          )}
        </section>
      )}

      {/* Modal para editar post desde el Feed Global (PATCH) */}
      <PostFormModal
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        subforumName={editingPost?.subforum || ''}
        initialPost={editingPost}
        onSubmit={handleEditPostFromHome}
      />

      {/* Modal para eliminar post desde el Feed Global (DELETE -> 204 No Content) */}
      <Modal
        isOpen={Boolean(deletingPost)}
        onClose={() => setDeletingPost(null)}
        title="Confirmar eliminación de publicación"
        subtitle="Esta acción es permanente y eliminará el post junto con todos sus comentarios."
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
                onClick={handleDeletePostFromHome}
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
