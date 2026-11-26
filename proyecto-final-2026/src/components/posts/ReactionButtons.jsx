import { useState } from 'react'
import { IconUpvote, IconDownvote } from '../ui/ForumIcons'

/**
 * Píldora de votación unificada estilo Reddit moderno: [ ⇧ likes | ⇩ dislikes ]
 * Con micro-animación spring, partícula +1 y explosión radial de chispas luminosas (Spark Burst).
 */
export default function ReactionButtons({
  likes = 0,
  dislikes = 0,
  onLike,
  onDislike,
}) {
  const [loadingType, setLoadingType] = useState(null)
  const [burstType, setBurstType] = useState(null)

  const triggerBurst = (type) => {
    setBurstType(type)
    setTimeout(() => {
      setBurstType((prev) => (prev === type ? null : prev))
    }, 680)
  }

  const handleLikeClick = async (e) => {
    e.stopPropagation()
    if (loadingType) return
    try {
      setLoadingType('like')
      triggerBurst('like')
      await onLike()
    } finally {
      setLoadingType(null)
    }
  }

  const handleDislikeClick = async (e) => {
    e.stopPropagation()
    if (loadingType) return
    try {
      setLoadingType('dislike')
      triggerBurst('dislike')
      await onDislike()
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="reddit-vote-pill" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`reddit-vote-btn vote-up-btn ${
          burstType === 'like' ? 'vote-burst active-up' : ''
        }`}
        onClick={handleLikeClick}
        disabled={Boolean(loadingType)}
        title="Dar Like (+1)"
      >
        {burstType === 'like' && (
          <>
            <span className="floating-plus-one floating-plus-like">+1</span>
            <span className="spark-ring spark-ring-like" aria-hidden="true">
              <i className="spark-dot s1" />
              <i className="spark-dot s2" />
              <i className="spark-dot s3" />
              <i className="spark-dot s4" />
              <i className="spark-dot s5" />
              <i className="spark-dot s6" />
            </span>
          </>
        )}
        <IconUpvote size={17} />
        <span>{likes}</span>
      </button>

      <span className="reddit-vote-sep" />

      <button
        type="button"
        className={`reddit-vote-btn vote-down-btn ${
          burstType === 'dislike' ? 'vote-burst active-down' : ''
        }`}
        onClick={handleDislikeClick}
        disabled={Boolean(loadingType)}
        title="Dar Dislike (+1)"
      >
        {burstType === 'dislike' && (
          <>
            <span className="floating-plus-one floating-plus-dislike">+1</span>
            <span className="spark-ring spark-ring-dislike" aria-hidden="true">
              <i className="spark-dot s1" />
              <i className="spark-dot s2" />
              <i className="spark-dot s3" />
              <i className="spark-dot s4" />
            </span>
          </>
        )}
        <IconDownvote size={17} />
        <span>{dislikes}</span>
      </button>
    </div>
  )
}
