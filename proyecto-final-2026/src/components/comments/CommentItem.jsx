import RichContentRenderer from '../ui/RichContentRenderer'
import { UserAvatar } from '../ui/ForumIcons'
import { formatDateTime, formatRelativeTime } from '../../utils/formatDate'
import { getSavedAuthor } from '../../utils/storage'

export default function CommentItem({
  comment,
  postAuthor,
  onSelectAuthor,
  onSelectSubforum,
  onReply,
}) {
  const activeAuthor = getSavedAuthor()
  const isCurrentUser =
    Boolean(activeAuthor) &&
    Boolean(comment?.author) &&
    activeAuthor.trim().toLowerCase() === comment.author.trim().toLowerCase()
  const isOriginalPoster =
    Boolean(postAuthor) &&
    Boolean(comment?.author) &&
    postAuthor.trim().toLowerCase() === comment.author.trim().toLowerCase()

  return (
    <div className={`comment-item ${isOriginalPoster ? 'comment-item-op' : ''}`}>
      <div className="comment-header">
        <div className="comment-author-box">
          <button
            type="button"
            className="author-profile-pill"
            onClick={() =>
              onSelectAuthor && comment.author && onSelectAuthor(comment.author)
            }
            title={`Ver perfil e historial de u/${comment.author}`}
          >
            <UserAvatar name={comment.author} size={20} />
            <strong className="comment-author">u/{comment.author}</strong>
            {isOriginalPoster && (
              <span
                className="op-author-badge"
                title="Autor original de esta publicación (Original Poster)"
              >
                OP
              </span>
            )}
            {isCurrentUser && <span className="you-badge">TÚ</span>}
          </button>
          <span className="meta-dot">•</span>
          <span className="comment-time" title={formatDateTime(comment.createdAt)}>
            {formatRelativeTime(comment.createdAt)} ({formatDateTime(comment.createdAt)})
          </span>
        </div>

        <div className="comment-header-actions">
          {onReply && comment?.author && (
            <button
              type="button"
              className="comment-reply-btn"
              onClick={() => onReply(comment.author)}
              title={`Responder mencionando a u/${comment.author}`}
            >
              ↩ Responder
            </button>
          )}
          <span className="comment-id">#{comment.id}</span>
        </div>
      </div>
      <div className="comment-content">
        <RichContentRenderer
          content={comment.content}
          onSelectAuthor={onSelectAuthor}
          onSelectSubforum={onSelectSubforum}
        />
      </div>
    </div>
  )
}
