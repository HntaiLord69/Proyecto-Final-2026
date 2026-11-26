import CommentItem from './CommentItem'
import EmptyState from '../ui/EmptyState'

export default function CommentList({
  comments = [],
  postAuthor = '',
  loading = false,
  onSelectAuthor,
  onSelectSubforum,
  onReply,
}) {
  if (loading) {
    return <div className="loading-card">Cargando comentarios...</div>
  }

  if (!comments || comments.length === 0) {
    return (
      <EmptyState
        icon="💭"
        title="Aún no hay comentarios"
        description="Sé la primera persona en comentar en esta publicación."
      />
    )
  }

  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postAuthor={postAuthor}
          onSelectAuthor={onSelectAuthor}
          onSelectSubforum={onSelectSubforum}
          onReply={onReply}
        />
      ))}
    </div>
  )
}
