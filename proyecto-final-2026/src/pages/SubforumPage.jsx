import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getSubforumByName,
  updateSubforumDescription,
} from '../services/subforumsService'
import {
  getPostsBySubforum,
  createPost,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
} from '../services/postsService'
import SubforumHeader from '../components/subforums/SubforumHeader'
import SubforumFormModal from '../components/subforums/SubforumFormModal'
import QuickPostComposer from '../components/posts/QuickPostComposer'
import PostFiltersBar from '../components/posts/PostFiltersBar'
import PostCard, {
  FLAIR_FILTER_OPTIONS,
  postMatchesFlairFilter,
} from '../components/posts/PostCard'
import PostFormModal from '../components/posts/PostFormModal'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import ErrorAlert from '../components/ui/ErrorAlert'
import EmptyState from '../components/ui/EmptyState'

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  sortBy: 'date',
  order: 'desc',
  hasImage: '',
  afterDate: '',
  beforeDate: '',
}

export default function SubforumPage({
  subforumName,
  onBackHome,
  onOpenPostDetail,
  onSelectAuthor,
  refreshTrigger,
  onSubforumUpdated,
  layout,
  onNotify,
}) {
  const [subforum, setSubforum] = useState(null)
  const [posts, setPosts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modales
  const [isEditDescOpen, setIsEditDescOpen] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [deletingPost, setDeletingPost] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeFlairFilter, setActiveFlairFilter] = useState('all')

  // Al cambiar de subforo, reiniciar filtros
  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
    setActiveFlairFilter('all')
  }, [subforumName])

  const loadSubforumAndPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [subData, postsResponse] = await Promise.all([
        getSubforumByName(subforumName),
        getPostsBySubforum(subforumName, {
          page: filters.page,
          limit: filters.limit,
          sortBy: filters.sortBy,
          order: filters.order,
          hasImage: filters.hasImage,
          afterDate: filters.afterDate,
          beforeDate: filters.beforeDate,
        }),
      ])
      setSubforum(subData)
      setPosts(postsResponse.data || [])
      setPagination(postsResponse.pagination || null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [
    subforumName,
    filters.page,
    filters.limit,
    filters.sortBy,
    filters.order,
    filters.hasImage,
    filters.afterDate,
    filters.beforeDate,
  ])

  useEffect(() => {
    loadSubforumAndPosts()
  }, [loadSubforumAndPosts, refreshTrigger])

  const handleUpdateDescription = async ({ description }) => {
    const updated = await updateSubforumDescription(subforumName, description)
    setSubforum(updated)
    if (onSubforumUpdated) onSubforumUpdated()
    if (onNotify) onNotify(`Descripción de r/${subforumName} actualizada`)
  }

  const handleCreateOrEditPost = async (payload) => {
    if (editingPost) {
      const updated = await updatePost(subforumName, editingPost.id, payload)
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      if (onNotify) onNotify(`Post #${updated.id} actualizado`)
    } else {
      await createPost(subforumName, payload)
      await loadSubforumAndPosts()
      if (onSubforumUpdated) onSubforumUpdated()
      if (onNotify) onNotify(`Nueva publicación creada en r/${subforumName}`)
    }
  }

  const handleQuickPublish = async (targetSub, payload) => {
    await createPost(targetSub, payload)
    await loadSubforumAndPosts()
    if (onSubforumUpdated) onSubforumUpdated()
    if (onNotify) onNotify(`Publicación creada en r/${targetSub}`)
  }

  const handleConfirmDelete = async () => {
    if (!deletingPost) return
    try {
      setDeleteLoading(true)
      await deletePost(subforumName, deletingPost.id)
      setDeletingPost(null)
      await loadSubforumAndPosts()
      if (onSubforumUpdated) onSubforumUpdated()
      if (onNotify) onNotify('Publicación eliminada (204 No Content)')
    } catch (err) {
      setError(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleLike = async (postId) => {
    try {
      const res = await likePost(subforumName, postId)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes: res.likes, dislikes: res.dislikes } : p,
        ),
      )
    } catch (err) {
      setError(err)
    }
  }

  const handleDislike = async (postId) => {
    try {
      const res = await dislikePost(subforumName, postId)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes: res.likes, dislikes: res.dislikes } : p,
        ),
      )
    } catch (err) {
      setError(err)
    }
  }

  const flairCounts = useMemo(() => {
    const counts = { all: posts.length }
    for (const opt of FLAIR_FILTER_OPTIONS) {
      if (opt.id === 'all') continue
      counts[opt.id] = posts.filter((p) => postMatchesFlairFilter(p, opt.id)).length
    }
    return counts
  }, [posts])

  const displayedPosts = useMemo(
    () => posts.filter((p) => postMatchesFlairFilter(p, activeFlairFilter)),
    [posts, activeFlairFilter],
  )

  return (
    <div className="page-container">
      <SubforumHeader
        subforum={subforum}
        onBackHome={onBackHome}
        onEditDescription={() => setIsEditDescOpen(true)}
        onCreatePost={() => {
          setEditingPost(null)
          setIsPostModalOpen(true)
        }}
      />

      {/* Barra rápida para publicar directamente dentro del subforo */}
      <QuickPostComposer
        subforumName={subforumName}
        onPublish={handleQuickPublish}
        onOpenFullModal={() => {
          setEditingPost(null)
          setIsPostModalOpen(true)
        }}
      />

      <PostFiltersBar
        filters={filters}
        onChangeFilters={setFilters}
        onResetFilters={() => {
          setFilters(DEFAULT_FILTERS)
          setActiveFlairFilter('all')
        }}
      />

      <div
        className="flair-filter-bar"
        role="toolbar"
        aria-label="Filtrar publicaciones por categoría"
      >
        <div className="flair-filter-chips">
          <span className="flair-filter-label">Tipo:</span>
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

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            loadSubforumAndPosts()
            if (onNotify) onNotify(`🔄 Subforo r/${subforumName} actualizado`)
          }}
          disabled={loading}
          title="Sincronizar publicaciones más recientes de este subforo"
        >
          🔄 Actualizar
        </button>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {loading ? (
        <div className="loading-stack">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : displayedPosts.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No hay publicaciones para mostrar"
          description="No se encontraron posts con los filtros actuales o este subforo aún no tiene publicaciones."
          actionLabel="+ Crear el primer Post"
          onAction={() => {
            setEditingPost(null)
            setIsPostModalOpen(true)
          }}
        />
      ) : (
        <>
          <div className="posts-feed">
            {displayedPosts.map((post, idx) => (
              <div
                key={post.id}
                className="animate-stagger"
                style={{ '--stagger': idx }}
              >
                <PostCard
                  post={post}
                  layout={layout}
                  onSelectSubforum={() => {}}
                  onSelectAuthor={onSelectAuthor}
                  onOpenDetail={(postId) => onOpenPostDetail(subforumName, postId)}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onEdit={(p) => {
                    setEditingPost(p)
                    setIsPostModalOpen(true)
                  }}
                  onDelete={(p) => setDeletingPost(p)}
                />
              </div>
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(newPage) =>
              setFilters((prev) => ({ ...prev, page: newPage }))
            }
          />
        </>
      )}

      {/* Modal para editar descripción del subforo (PATCH /subforums/:name) */}
      <SubforumFormModal
        isOpen={isEditDescOpen}
        onClose={() => setIsEditDescOpen(false)}
        initialSubforum={subforum}
        onSubmit={handleUpdateDescription}
      />

      {/* Modal para crear o editar post (POST / PATCH) */}
      <PostFormModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false)
          setEditingPost(null)
        }}
        subforumName={subforumName}
        initialPost={editingPost}
        onSubmit={handleCreateOrEditPost}
      />

      {/* Modal de confirmación para eliminar post (DELETE -> 204 No Content) */}
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
              <span>Publicado por u/{deletingPost.author}</span>
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
                onClick={handleConfirmDelete}
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
