import { useState } from 'react'
import {
  IconFlame,
  IconLogo,
  IconPlus,
  IconSearch,
  IconSparkles,
  IconUnisonLogo,
  LCC_OFFICIAL_URL,
  SubforumEmblem,
  UNISON_OFFICIAL_URL,
  UserAvatar,
} from '../ui/ForumIcons'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Sidebar({
  subforums = [],
  authors = [],
  bookmarksCount = 0,
  activeSubforumName,
  activeAuthorName,
  homeTab = 'for-you',
  onSelectHomeTab,
  onSelectSubforum,
  onSelectAuthor,
  onNavigateHome,
  onOpenCreateSubforum,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const [filterText, setFilterText] = useState('')

  const filtered = filterText.trim()
    ? subforums.filter((s) =>
        s.name.toLowerCase().includes(filterText.trim().toLowerCase()),
      )
    : subforums

  return (
    <aside className={`sidebar ${isMobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Cabecera del Cajón Móvil (Solo visible en <= 860px) */}
      <div className="mobile-drawer-header">
        <strong>🌐 Menú y Comunidades</strong>
        <button
          type="button"
          className="mobile-drawer-close"
          onClick={onCloseMobile}
          aria-label="Cerrar menú lateral"
        >
          ✕
        </button>
      </div>

      {/* Tarjeta Oficial de la Carrera LCC UNISON (Redirige en 1 clic a https://cc.unison.mx/) */}
      <a
        href={LCC_OFFICIAL_URL}
        target="_blank"
        rel="noreferrer"
        className="sidebar-card lcc-career-banner-card"
        title="Abrir página oficial de la Licenciatura en Ciencias de la Computación — UNISON (https://cc.unison.mx/)"
      >
        <IconLogo size={42} />
        <div className="lcc-career-banner-info">
          <span className="lcc-career-eyebrow">PORTAL DE LA CARRERA</span>
          <strong>Ciencias de la Computación</strong>
          <span className="lcc-career-url">cc.unison.mx ↗</span>
        </div>
      </a>

      {/* Tarjeta Oficial de la Universidad de Sonora (Redirige en 1 clic a https://www.unison.mx/) */}
      <a
        href={UNISON_OFFICIAL_URL}
        target="_blank"
        rel="noreferrer"
        className="sidebar-card unison-university-banner-card"
        title="Abrir portal general de la Universidad de Sonora — Todo lo Iluminan (https://www.unison.mx/)"
      >
        <IconUnisonLogo size={42} />
        <div className="lcc-career-banner-info">
          <span className="unison-university-eyebrow">TODO LO ILUMINAN • 1942</span>
          <strong>Universidad de Sonora</strong>
          <span className="unison-university-url">www.unison.mx ↗</span>
        </div>
      </a>

      {/* Tarjeta Glass 1: Navegación Principal + Comunidades */}
      <div className="sidebar-card">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">Navegación</span>
        </div>

        <ul className="sidebar-nav-list">
          <li>
            <button
              type="button"
              className={`sidebar-nav-item ${
                !activeSubforumName && !activeAuthorName && homeTab === 'for-you'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                onNavigateHome()
                if (onSelectHomeTab) onSelectHomeTab('for-you')
              }}
            >
              <span className="sidebar-nav-label">
                <IconSparkles size={17} />
                <span>Feed Principal (Para Ti)</span>
              </span>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={`sidebar-nav-item ${
                !activeSubforumName && !activeAuthorName && homeTab === 'popular'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                onNavigateHome()
                if (onSelectHomeTab) onSelectHomeTab('popular')
              }}
            >
              <span className="sidebar-nav-label">
                <IconFlame size={17} />
                <span>Populares (Más Likes)</span>
              </span>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={`sidebar-nav-item ${
                !activeSubforumName && !activeAuthorName && homeTab === 'saved'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                onNavigateHome()
                if (onSelectHomeTab) onSelectHomeTab('saved')
              }}
            >
              <span className="sidebar-nav-label">
                <span>🔖</span>
                <span>Guardados / Favoritos</span>
              </span>
              <span className="sidebar-badge">{bookmarksCount}</span>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={`sidebar-nav-item ${
                !activeSubforumName && !activeAuthorName && homeTab === 'explore'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                onNavigateHome()
                if (onSelectHomeTab) onSelectHomeTab('explore')
              }}
            >
              <span className="sidebar-nav-label">
                <span>🌐</span>
                <span>Explorar Comunidades</span>
              </span>
            </button>
          </li>
        </ul>

        <div className="sidebar-divider" />

        <div className="sidebar-section-header">
          <span className="sidebar-section-title">
            Comunidades ({subforums.length})
          </span>
          <button
            type="button"
            className="btn-link"
            onClick={onOpenCreateSubforum}
            title="Crear un nuevo subforo"
          >
            + Crear
          </button>
        </div>

        {subforums.length > 2 && (
          <div className="sidebar-search-box">
            <IconSearch size={14} />
            <input
              type="search"
              className="sidebar-search-input"
              placeholder="Filtrar r/subforo..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="sidebar-empty">Sin resultados.</p>
        ) : (
          <ul className="sidebar-nav-list">
            {filtered.map((sub) => (
              <li key={sub.name}>
                <button
                  type="button"
                  className={`sidebar-nav-item ${
                    activeSubforumName === sub.name ? 'active' : ''
                  }`}
                  onClick={() => onSelectSubforum(sub.name)}
                >
                  <span className="sidebar-nav-label">
                    <SubforumEmblem name={sub.name} size={24} />
                    <span className="sidebar-subforum-name">r/{sub.name}</span>
                  </span>
                  <span className="sidebar-badge">{sub.postCount}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="btn btn-primary btn-sm rail-full-btn"
          onClick={onOpenCreateSubforum}
        >
          <IconPlus size={15} />
          <span>Nuevo Subforo</span>
        </button>
      </div>

      {/* Tarjeta Glass 2: Acceso 1-Clic a Perfiles de Usuarios con Podio */}
      {authors.length > 0 && (
        <div className="sidebar-card">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">
              👤 Perfiles de Usuarios
            </span>
          </div>
          <ul className="sidebar-nav-list" style={{ marginBottom: 0 }}>
            {authors.map((a, idx) => (
              <li key={a.name}>
                <button
                  type="button"
                  className={`sidebar-nav-item ${
                    activeAuthorName &&
                    activeAuthorName.toLowerCase() === a.name.toLowerCase()
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => onSelectAuthor && onSelectAuthor(a.name)}
                  title={`Ver perfil e historial de publicaciones de u/${a.name}`}
                >
                  <span className="sidebar-nav-label">
                    <UserAvatar name={a.name} size={22} />
                    <span className="sidebar-subforum-name">
                      {MEDALS[idx] ? `${MEDALS[idx]} ` : ''}u/{a.name}
                    </span>
                  </span>
                  <span className="sidebar-badge">{a.postCount} posts</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
