import { useState, useEffect } from 'react'
import { PALETTES } from './Navbar'
import {
  CommunityBannerArt,
  IconFlame,
  IconLogo,
  IconPalette,
  IconPlus,
  IconSparkles,
  IconUnisonLogo,
  LCC_OFFICIAL_URL,
  SubforumEmblem,
  UNISON_OFFICIAL_URL,
  UserAvatar,
} from '../ui/ForumIcons'
import { formatDateTime, formatRelativeTime } from '../../utils/formatDate'
import {
  clearRecentlyViewedPosts,
  computeAuthorRank,
  getRecentlyViewedPosts,
} from '../../utils/storage'

const MEDALS = ['🥇', '🥈', '🥉']

/**
 * Columna Derecha Glassmorphic (Right Rail).
 * Combina el estilo de cristal translúcido con los widgets de Reddit:
 * 1. Ficha contextual del subforo activo.
 * 2. Podio y Perfiles de Usuario en 1 Clic (u/autor).
 * 3. Publicaciones Recientes (RECENT POSTS) con miniatura cuadrada a la derecha.
 * 4. Paleta Visual (6 temas Glass perfectamente dimensionados sin salirse).
 * 5. Ranking de Comunidades con barras animadas.
 */
export default function RightRail({
  subforums = [],
  recentPosts = [],
  authors = [],
  activeSubforumName,
  activeAuthorName,
  onSelectSubforum,
  onOpenPostDetail,
  onSelectAuthor,
  onOpenCreateSubforum,
  theme,
  onThemeChange,
}) {
  const [recentlyViewed, setRecentlyViewed] = useState(getRecentlyViewedPosts)

  useEffect(() => {
    const onViewedChange = (e) => {
      setRecentlyViewed(e.detail || getRecentlyViewedPosts())
    }
    window.addEventListener('lcc-recent-viewed-changed', onViewedChange)
    return () =>
      window.removeEventListener('lcc-recent-viewed-changed', onViewedChange)
  }, [])

  const activeSubforum = activeSubforumName
    ? subforums.find((s) => s.name === activeSubforumName)
    : null

  const totalPosts = subforums.reduce((acc, s) => acc + (s.postCount || 0), 0)
  const maxPosts = Math.max(1, ...subforums.map((s) => s.postCount || 0))
  const topSubforums = [...subforums]
    .sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
    .slice(0, 5)

  return (
    <aside className="right-rail">
      {/* 1. Ficha Contextual cuando el usuario está dentro de un Subforo */}
      {activeSubforum && (
        <div className="rail-card rail-community-profile animate-stagger">
          <div className="rail-community-banner">
            <CommunityBannerArt seed={activeSubforum.name} />
          </div>
          <div className="rail-community-body">
            <div className="rail-community-head">
              <SubforumEmblem name={activeSubforum.name} size={50} />
              <div>
                <span className="rail-eyebrow">Comunidad Activa</span>
                <h3 className="rail-community-title">r/{activeSubforum.name}</h3>
              </div>
            </div>

            <p className="rail-community-desc">{activeSubforum.description}</p>

            <div className="rail-kpi-grid">
              <div className="rail-kpi-box">
                <strong>{activeSubforum.postCount}</strong>
                <span>Publicaciones</span>
              </div>
              <div className="rail-kpi-box">
                <strong>{formatRelativeTime(activeSubforum.lastActivityAt)}</strong>
                <span>Última actividad</span>
              </div>
            </div>

            <div className="rail-community-created">
              📅 Creado el {formatDateTime(activeSubforum.createdAt)}
            </div>
          </div>
        </div>
      )}

      {/* 2. Podio y Perfiles de Usuarios en 1 Clic */}
      {authors.length > 0 && (
        <div className="rail-card">
          <div className="rail-card-header">
            <div className="rail-card-title-group">
              <IconSparkles size={17} />
              <h4 className="rail-card-title">Top Autores y Perfiles</h4>
            </div>
            <span className="rail-badge">1-Clic</span>
          </div>

          <div className="rail-authors-list">
            {authors.map((a, idx) => {
              const rank = computeAuthorRank({
                netKarma: a.netKarma,
                postCount: a.postCount,
              })
              return (
                <button
                  key={`rail-author-${a.name}`}
                  type="button"
                  className={`rail-author-card ${
                    activeAuthorName &&
                    activeAuthorName.toLowerCase() === a.name.toLowerCase()
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => onSelectAuthor && onSelectAuthor(a.name)}
                  title={`Abrir perfil completo e historial de publicaciones de u/${a.name}`}
                >
                  <div className="rail-author-left">
                    <UserAvatar name={a.name} size={28} />
                    <div className="rail-author-meta">
                      <strong>
                        {MEDALS[idx] ? `${MEDALS[idx]} ` : ''}u/{a.name}{' '}
                        <span
                          className={`author-rank-micro ${rank.className}`}
                          title={rank.label}
                        >
                          {rank.icon}
                        </span>
                      </strong>
                      <span>
                        {rank.label} • {a.postCount}{' '}
                        {a.postCount === 1 ? 'post' : 'posts'} • 🔥{' '}
                        {a.netKarma >= 0 ? `+${a.netKarma}` : a.netKarma}
                      </span>
                    </div>
                  </div>
                  <span className="rail-author-cta">Perfil →</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 2.5. Historial Real de Posts Vistos Recientemente por el Usuario (con botón Limpiar / Clear estilo Reddit) */}
      {recentlyViewed.length > 0 && (
        <div className="rail-card">
          <div className="rail-card-header">
            <div className="rail-card-title-group">
              <span>👁️</span>
              <h4 className="rail-card-title">Vistos Recientemente</h4>
            </div>
            <button
              type="button"
              className="btn-link"
              onClick={() => clearRecentlyViewedPosts()}
              title="Limpiar tu historial local de lectura"
            >
              Limpiar
            </button>
          </div>

          <div className="reddit-recent-list">
            {recentlyViewed.slice(0, 4).map((vPost) => (
              <div
                key={`viewed-${vPost.subforum}-${vPost.id}`}
                className="reddit-recent-item"
                onClick={() =>
                  onOpenPostDetail && onOpenPostDetail(vPost.subforum, vPost.id)
                }
                role="button"
                tabIndex={0}
              >
                <div className="reddit-recent-info">
                  <div className="reddit-recent-sub">
                    <SubforumEmblem name={vPost.subforum} size={16} />
                    <span>r/{vPost.subforum}</span>
                    <span>•</span>
                    <span>u/{vPost.author}</span>
                  </div>
                  <div className="reddit-recent-title">{vPost.title}</div>
                  <div className="reddit-recent-counts">
                    Visto {formatRelativeTime(vPost.viewedAt)}
                  </div>
                </div>
                {vPost.imageUrl && (
                  <img
                    src={vPost.imageUrl}
                    alt=""
                    className="reddit-recent-thumb"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Publicaciones Recientes (RECENT POSTS estilo Reddit con miniatura cuadrada) */}
      <div className="rail-card">
        <div className="rail-card-header">
          <div className="rail-card-title-group">
            <IconFlame size={17} />
            <h4 className="rail-card-title">Publicaciones Recientes</h4>
          </div>
          <span className="rail-badge">{recentPosts.length} posts</span>
        </div>

        {recentPosts.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0 }}>
            Cargando historial reciente...
          </p>
        ) : (
          <div className="reddit-recent-list">
            {recentPosts.slice(0, 5).map((post) => (
              <div
                key={`rail-post-${post.subforum}-${post.id}`}
                className="reddit-recent-item"
                onClick={() =>
                  onOpenPostDetail && onOpenPostDetail(post.subforum, post.id)
                }
                role="button"
                tabIndex={0}
              >
                <div className="reddit-recent-info">
                  <div className="reddit-recent-sub">
                    <SubforumEmblem name={post.subforum} size={18} />
                    <span>r/{post.subforum}</span>
                    <span>•</span>
                    <button
                      type="button"
                      className="recent-author-inline"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onSelectAuthor && post.author) {
                          onSelectAuthor(post.author)
                        }
                      }}
                    >
                      u/{post.author}
                    </button>
                  </div>
                  <div className="reddit-recent-title">{post.title}</div>
                  <div className="reddit-recent-counts">
                    {post.likes} likes • {post.commentCount} comentarios •{' '}
                    {formatRelativeTime(post.createdAt)}
                  </div>
                </div>

                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="reddit-recent-thumb"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Selector de Paleta Visual (Perfectamente dimensionado sin salirse del cuadro) */}
      <div className="rail-card">
        <div className="rail-card-header">
          <div className="rail-card-title-group">
            <IconPalette size={17} />
            <h4 className="rail-card-title">Paleta Visual Glass</h4>
          </div>
          <span className="rail-badge">10 Temas</span>
        </div>

        <div className="reddit-theme-grid">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`reddit-theme-btn ${theme === p.id ? 'active' : ''}`}
              onClick={() => onThemeChange(p.id)}
              title={p.desc}
            >
              <span
                className="reddit-theme-swatch"
                style={{ backgroundColor: p.dot }}
              />
              <span className="reddit-theme-label">{p.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Ranking de Comunidades con Barras Animadas */}
      <div className="rail-card">
        <div className="rail-card-header">
          <div className="rail-card-title-group">
            <IconFlame size={17} />
            <h4 className="rail-card-title">Ranking de Comunidades</h4>
          </div>
          <span className="rail-badge">{totalPosts} posts</span>
        </div>

        <div className="rail-ranking-list">
          {topSubforums.map((sub, idx) => {
            const pct = Math.max(
              14,
              Math.round(((sub.postCount || 0) / maxPosts) * 100),
            )
            return (
              <button
                key={sub.name}
                type="button"
                className={`rail-ranking-item ${
                  activeSubforumName === sub.name ? 'active' : ''
                }`}
                onClick={() => onSelectSubforum(sub.name)}
              >
                <div className="rail-ranking-top">
                  <div className="rail-ranking-name">
                    <span className="rail-rank-num">0{idx + 1}</span>
                    <SubforumEmblem name={sub.name} size={22} />
                    <span>r/{sub.name}</span>
                  </div>
                  <span className="rail-ranking-count">
                    {sub.postCount} posts
                  </span>
                </div>
                <div className="rail-progress-track">
                  <div
                    className="rail-progress-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm rail-full-btn"
          onClick={onOpenCreateSubforum}
        >
          <IconPlus size={15} />
          <span>Abrir nueva comunidad</span>
        </button>
      </div>

      {/* 6. Portales Oficiales Universidad de Sonora y LCC */}
      <div className="rail-card rail-institutional-hub">
        <div className="rail-card-header">
          <div className="rail-card-title-group">
            <IconSparkles size={17} />
            <h4 className="rail-card-title">Red Oficial UNISON</h4>
          </div>
          <span className="rail-badge">Enlaces</span>
        </div>

        <div className="rail-institutional-links">
          <a
            href={UNISON_OFFICIAL_URL}
            target="_blank"
            rel="noreferrer"
            className="rail-portal-tile rail-portal-unison"
            title="Visitar portal general de la Universidad de Sonora (https://www.unison.mx/)"
          >
            <IconUnisonLogo size={38} />
            <div className="rail-portal-text">
              <strong>Universidad de Sonora</strong>
              <span>Portal General • www.unison.mx ↗</span>
            </div>
          </a>

          <a
            href={LCC_OFFICIAL_URL}
            target="_blank"
            rel="noreferrer"
            className="rail-portal-tile rail-portal-lcc"
            title="Visitar portal oficial de la Licenciatura en Ciencias de la Computación (https://cc.unison.mx/)"
          >
            <IconLogo size={38} />
            <div className="rail-portal-text">
              <strong>Lic. en Ciencias de la Computación</strong>
              <span>Portal de la Carrera • cc.unison.mx ↗</span>
            </div>
          </a>
        </div>
      </div>
    </aside>
  )
}
