import { CommunityBannerArt, SubforumEmblem } from '../ui/ForumIcons'
import { formatDateTime, formatRelativeTime } from '../../utils/formatDate'

export default function SubforumHeader({
  subforum,
  onEditDescription,
  onCreatePost,
  onBackHome,
}) {
  if (!subforum) return null

  return (
    <section className="subforum-hero border-beam-card">
      {/* Banner Panorámico con Arte Vectorial Generativo */}
      <div className="subforum-panoramic-cover">
        <CommunityBannerArt seed={subforum.name} />
        <div className="subforum-cover-breadcrumbs">
          <button type="button" className="cover-breadcrumb-btn" onClick={onBackHome}>
            ← Todas las comunidades
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="cover-breadcrumb-current">r/{subforum.name}</span>
        </div>
      </div>

      <div className="subforum-hero-body">
        <div className="subforum-hero-main">
          <div className="subforum-hero-info">
            <div className="subforum-hero-title-row">
              <div className="subforum-emblem-overlap">
                <SubforumEmblem name={subforum.name} size={64} />
              </div>
              <div>
                <h1 className="subforum-hero-title">r/{subforum.name}</h1>
                <div className="subforum-hero-meta">
                  <span className="meta-pill">
                    📝 <strong>{subforum.postCount}</strong>{' '}
                    {subforum.postCount === 1 ? 'publicación' : 'publicaciones'}
                  </span>
                  <span
                    className="meta-pill"
                    title={formatDateTime(subforum.lastActivityAt)}
                  >
                    <span className="activity-pulse" /> Última actividad:{' '}
                    {formatRelativeTime(subforum.lastActivityAt)}
                  </span>
                  <span className="meta-pill">
                    📅 Creado: {formatDateTime(subforum.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <p className="subforum-hero-description">{subforum.description}</p>
          </div>

          <div className="subforum-hero-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onEditDescription}
              title="PATCH /subforums/:name — Editar descripción del subforo"
            >
              ✎ Editar descripción
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onCreatePost}
              title="POST /subforums/:name/posts — Publicar un nuevo post"
            >
              + Nuevo Post
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
