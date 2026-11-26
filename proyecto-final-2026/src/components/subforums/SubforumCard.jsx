import { SubforumEmblem } from '../ui/ForumIcons'
import { formatDateTime, formatRelativeTime } from '../../utils/formatDate'

export default function SubforumCard({ subforum, onSelect, layout = 'reddit' }) {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <article
      className={`subforum-card spotlight-card subforum-layout-${layout}`}
      onMouseMove={handleMouseMove}
      onClick={() => onSelect(subforum.name)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(subforum.name)
      }}
    >
      <div className="subforum-card-banner" />
      <div className="subforum-card-inner">
        <div className="subforum-card-top">
          <div className="subforum-identity">
            <SubforumEmblem name={subforum.name} size={46} />
            <div>
              <h3 className="subforum-title">r/{subforum.name}</h3>
              <span
                className="subforum-activity"
                title={`Última actividad: ${formatDateTime(subforum.lastActivityAt)}`}
              >
                <span className="activity-pulse" /> Activo{' '}
                {formatRelativeTime(subforum.lastActivityAt)}
              </span>
            </div>
          </div>
          <div className="subforum-stats-pill">
            <strong>{subforum.postCount}</strong>
            <span>{subforum.postCount === 1 ? 'post' : 'posts'}</span>
          </div>
        </div>

        <p className="subforum-description">{subforum.description}</p>

        <div className="subforum-card-footer">
          <span className="text-muted">Desde {formatDateTime(subforum.createdAt)}</span>
          <span className="subforum-enter-link">Explorar y publicar →</span>
        </div>
      </div>
    </article>
  )
}
