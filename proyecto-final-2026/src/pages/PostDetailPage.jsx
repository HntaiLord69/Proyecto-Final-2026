import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getPostById,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
} from '../services/postsService'
import {
  getCommentsByPost,
  createComment,
} from '../services/commentsService'
import PostCard from '../components/posts/PostCard'
import PostFormModal from '../components/posts/PostFormModal'
import CommentList from '../components/comments/CommentList'
import CommentForm from '../components/comments/CommentForm'
import Modal from '../components/ui/Modal'
import ErrorAlert from '../components/ui/ErrorAlert'
import { IconSearch } from '../components/ui/ForumIcons'
import { addRecentlyViewedPost } from '../utils/storage'

export default function PostDetailPage({
  subforumName,
  postId,
  onBackToSubforum,
  onBackHome,
  onSelectAuthor,
  refreshTrigger,
  onPostDeleted,
  onNotify,
}) {
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loadingPost, setLoadingPost] = useState(true)
  const [loadingComments, setLoadingComments] = useState(true)
  const [error, setError] = useState(null)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Ordenamiento, búsqueda interna y respuesta rápida en comentarios
  const [commentSort, setCommentSort] = useState('oldest') // 'oldest' | 'newest' | 'author'
  const [commentSearch, setCommentSearch] = useState('')
  const [replyToSignal, setReplyToSignal] = useState(null)

  const fetchDetail = useCallback(async () => {
    try {
      setLoadingPost(true)
      setLoadingComments(true)
      setError(null)

      const [postData, commentsData] = await Promise.all([
        getPostById(subforumName, postId),
        getCommentsByPost(subforumName, postId),
      ])

      setPost(postData)
      if (postData) {
        addRecentlyViewedPost(postData)
      }
      setComments(Array.isArray(commentsData) ? commentsData : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoadingPost(false)
      setLoadingComments(false)
    }
  }, [subforumName, postId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail, refreshTrigger])

  const filteredAndSortedComments = useMemo(() => {
    const q = commentSearch.trim().toLowerCase()
    const base = q
      ? comments.filter(
          (c) =>
            (c.content || '').toLowerCase().includes(q) ||
            (c.author || '').toLowerCase().includes(q),
        )
      : [...comments]

    return base.sort((a, b) => {
      if (commentSort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      if (commentSort === 'author') {
        return (a.author || '').localeCompare(b.author || '')
      }
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  }, [comments, commentSearch, commentSort])

  const handleLike = async () => {
    if (!post) return
    try {
      const res = await likePost(subforumName, post.id)
      setPost((prev) => ({
        ...prev,
        likes: res.likes,
        dislikes: res.dislikes,
      }))
    } catch (err) {
      setError(err)
    }
  }

  const handleDislike = async () => {
    if (!post) return
    try {
      const res = await dislikePost(subforumName, post.id)
      setPost((prev) => ({
        ...prev,
        likes: res.likes,
        dislikes: res.dislikes,
      }))
    } catch (err) {
      setError(err)
    }
  }

  const handleEditPost = async (changes) => {
    const updated = await updatePost(subforumName, post.id, changes)
    setPost(updated)
    if (onNotify) onNotify(`Post #${updated.id} actualizado`)
  }

  const handleConfirmDelete = async () => {
    if (!post) return
    try {
      setDeleteLoading(true)
      await deletePost(subforumName, post.id)
      setIsDeleteOpen(false)
      if (onPostDeleted) onPostDeleted()
      if (onNotify) onNotify('Publicación eliminada permanentemente')
      onBackToSubforum(subforumName)
    } catch (err) {
      setError(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCreateComment = async (payload) => {
    const created = await createComment(subforumName, post.id, payload)
    setComments((prev) => [...prev, created])
    setPost((prev) => ({
      ...prev,
      commentCount: (prev?.commentCount || 0) + 1,
    }))
    if (onPostDeleted) onPostDeleted() // Refresca lastActivityAt del subforo en Sidebar y RightRail
    if (onNotify) onNotify('Comentario publicado (201 Created)')
  }

  return (
    <div className="page-container">
      {/* Migas de pan */}
      <div className="subforum-hero-breadcrumbs">
        <button type="button" className="btn-breadcrumb" onClick={onBackHome}>
          Subforos
        </button>
        <span className="breadcrumb-sep">/</span>
        <button
          type="button"
          className="btn-breadcrumb"
          onClick={() => onBackToSubforum(subforumName)}
        >
          r/{subforumName}
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Post #{postId}</span>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {loadingPost ? (
        <div className="skeleton-card" />
      ) : post ? (
        <>
          <PostCard
            post={post}
            isDetailView
            onSelectSubforum={onBackToSubforum}
            onSelectAuthor={onSelectAuthor}
            onLike={handleLike}
            onDislike={handleDislike}
            onEdit={() => setIsEditOpen(true)}
            onDelete={() => setIsDeleteOpen(true)}
          />

          <section className="comments-section">
            <div className="comments-section-header">
              <div>
                <h3>💬 Comentarios ({comments.length})</h3>
                <span className="text-muted">
                  Haz clic en &ldquo;↩ Responder&rdquo; para mencionar a un autor
                </span>
              </div>

              <div className="comments-controls-bar">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={fetchDetail}
                  disabled={loadingComments}
                  title="Sincronizar comentarios más recientes del servidor"
                >
                  🔄 Actualizar
                </button>

                {comments.length > 0 && (
                  <>
                    <div className="comment-search-mini">
                      <IconSearch size={14} />
                      <input
                        type="search"
                        className="comment-search-input"
                        placeholder="Buscar en comentarios..."
                        value={commentSearch}
                        onChange={(e) => setCommentSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className="select-input select-sm"
                      value={commentSort}
                      onChange={(e) => setCommentSort(e.target.value)}
                      aria-label="Ordenar comentarios"
                    >
                      <option value="oldest">⏳ Más antiguos (Cronológico)</option>
                      <option value="newest">🕒 Más recientes primero</option>
                      <option value="author">👤 Por autor (A-Z)</option>
                    </select>
                  </>
                )}
              </div>
            </div>

            <CommentForm
              postId={post.id}
              onSubmit={handleCreateComment}
              replyToSignal={replyToSignal}
            />

            <CommentList
              comments={filteredAndSortedComments}
              postAuthor={post.author}
              loading={loadingComments}
              onSelectAuthor={onSelectAuthor}
              onSelectSubforum={onBackToSubforum}
              onReply={(authorName) =>
                setReplyToSignal({ author: authorName, ts: Date.now() })
              }
            />
          </section>
        </>
      ) : null}

      {/* Modal para editar el post (PATCH) */}
      <PostFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        subforumName={subforumName}
        initialPost={post}
        onSubmit={handleEditPost}
      />

      {/* Modal para confirmar eliminación (DELETE) */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="¿Eliminar esta publicación?"
        subtitle="Se borrará permanentemente el post y todos sus comentarios asociados."
        size="sm"
      >
        <div className="form-stack">
          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDeleteOpen(false)}
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
              {deleteLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
