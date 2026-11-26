import { useState, useEffect, useRef, useMemo } from 'react'
import Modal from '../ui/Modal'
import {
  IconLogo,
  IconPalette,
  IconPlus,
  IconSearch,
  IconUnisonLogo,
  LCC_OFFICIAL_URL,
  SubforumEmblem,
  UNISON_OFFICIAL_URL,
  UserAvatar,
} from '../ui/ForumIcons'
import { getSavedAuthor, saveAuthor } from '../../utils/storage'

export const PALETTES = [
  {
    id: 'tokyo-night',
    shortLabel: 'Tokyo Night',
    label: '🌆 Tokyo Night',
    dot: '#7aa2f7',
    colors: ['#1a1b26', '#7aa2f7', '#bb9af7', '#9ece6a'],
    desc: 'Cristal oscuro japonés moderno con destellos índigo y violeta',
  },
  {
    id: 'lcc-unison',
    shortLabel: 'LCC UNISON',
    label: '🦅 LCC UNISON',
    dot: '#009fe3',
    colors: ['#07111e', '#009fe3', '#f5a800', '#0055a5'],
    desc: 'Azul oficial Ciencias de la Computación y Dorado UNISON',
  },
  {
    id: 'reddit-dark',
    shortLabel: 'Reddit Glass',
    label: '🔥 Reddit Glass',
    dot: '#ff4500',
    colors: ['#0e1113', '#ff4500', '#7193ff', '#46d160'],
    desc: 'Oscuro oficial de Reddit con paneles translúcidos y Orangered',
  },
  {
    id: 'gruvbox-dark',
    shortLabel: 'Gruvbox Dark',
    label: '🦊 Gruvbox Dark',
    dot: '#fe8019',
    colors: ['#282828', '#fe8019', '#fabd2f', '#b8bb26'],
    desc: 'Cálido retro translúcido para sesiones largas',
  },
  {
    id: 'catppuccin',
    shortLabel: 'Catppuccin',
    label: '🐾 Catppuccin Mocha',
    dot: '#cba6f7',
    colors: ['#1e1e2e', '#cba6f7', '#89b4fa', '#a6e3a1'],
    desc: 'Cristal pastel nocturno suave',
  },
  {
    id: 'dracula',
    shortLabel: 'Dracula Pro',
    label: '🧛 Dracula Pro',
    dot: '#bd93f9',
    colors: ['#282a36', '#bd93f9', '#ff79c6', '#50fa7b'],
    desc: 'Púrpura vampiro clásico con acentos rosa y cian neón',
  },
  {
    id: 'nord',
    shortLabel: 'Nord Polar',
    label: '❄️ Nord Polar',
    dot: '#88c0d0',
    colors: ['#2e3440', '#88c0d0', '#81a1c1', '#a3be8c'],
    desc: 'Azul ártico escandinavo de contraste suave',
  },
  {
    id: 'synthwave',
    shortLabel: 'Cyberpunk 84',
    label: '🕹️ Cyberpunk 84',
    dot: '#ff2a85',
    colors: ['#0f071e', '#ff2a85', '#00f0ff', '#00f5a0'],
    desc: 'Neón magenta y cian eléctrico retro-futurista',
  },
  {
    id: 'reddit-light',
    shortLabel: 'Reddit Light',
    label: '☀️ Reddit Daylight',
    dot: '#ff4500',
    colors: ['#ffffff', '#ff4500', '#0079d3', '#edeff1'],
    desc: 'Cristal claro estilo Reddit oficial',
  },
  {
    id: 'gruvbox-light',
    shortLabel: 'Gruvbox Light',
    label: '📜 Gruvbox Paper',
    dot: '#d65d0e',
    colors: ['#fbf1c7', '#d65d0e', '#b57614', '#79740e'],
    desc: 'Pergamino cálido descansado para la vista',
  },
]

export const LAYOUT_MODES = [
  { id: 'reddit', label: 'Tarjetas Glass', desc: 'Tarjetas ricas con escenario multimedia' },
  { id: 'compact', label: 'Compacto', desc: 'Vista densa de filas para lectura rápida' },
]

/**
 * Resalta visualmente la subcadena coincidente dentro de cada sugerencia del autocompletado.
 */
function HighlightMatch({ text = '', query = '' }) {
  const cleanQ = query.replace(/^([rs]|u)\//i, '').replace(/^@/, '').trim()
  if (!cleanQ || !text) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQ = cleanQ.toLowerCase()
  const idx = lowerText.indexOf(lowerQ)
  if (idx === -1) return <>{text}</>

  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + cleanQ.length)
  const after = text.slice(idx + cleanQ.length)

  return (
    <>
      {before}
      <mark className="autocomplete-highlight">{match}</mark>
      {after}
    </>
  )
}

export default function Navbar({
  theme,
  onThemeChange,
  layout,
  onLayoutChange,
  isTheaterMode = false,
  onToggleTheaterMode,
  searchQuery,
  onSearchChange,
  subforums = [],
  recentPosts = [],
  authors = [],
  onSelectSubforum,
  onOpenPostDetail,
  onSelectAuthor,
  onOpenCommandPalette,
  onNavigateHome,
  onOpenCreatePost,
  onOpenCreateSubforum,
  onToggleMobileMenu,
  onNotify,
}) {
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false)
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false)
  const [activeAlias, setActiveAlias] = useState(getSavedAuthor)
  const [aliasInput, setAliasInput] = useState(getSavedAuthor)

  // Estados del Autocompletado Interactivo de Búsqueda
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchScope, setSearchScope] = useState('all') // 'all' | 'subforums' | 'authors' | 'posts'
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const searchContainerRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const onAuthorChanged = (e) => {
      setActiveAlias(e.detail || '')
      setAliasInput(e.detail || '')
    }
    window.addEventListener('lcc-author-changed', onAuthorChanged)
    return () => window.removeEventListener('lcc-author-changed', onAuthorChanged)
  }, [])

  // Cerrar dropdown de autocompletado al hacer clic fuera del buscador
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentPalette = PALETTES.find((p) => p.id === theme) || PALETTES[0]
  const displayAlias = activeAlias || authors[0]?.name || ''

  // Detectar prefijo inteligente (r/, s/, u/, @) y filtrar Subforos, Usuarios y Posts en tiempo real
  const autocompleteData = useMemo(() => {
    const raw = (searchQuery || '').trim()
    const isSubforumPrefix = /^[rs]\//i.test(raw)
    const isAuthorPrefix = /^(u\/|@)/i.test(raw)
    const cleanTerm = raw
      .replace(/^([rs]|u)\//i, '')
      .replace(/^@/, '')
      .trim()
      .toLowerCase()

    const effectiveScope = isSubforumPrefix
      ? 'subforums'
      : isAuthorPrefix
        ? 'authors'
        : searchScope

    const matchedSubforums =
      effectiveScope === 'all' || effectiveScope === 'subforums'
        ? subforums
            .filter((s) => {
              if (!cleanTerm) return true
              return (
                (s.name || '').toLowerCase().includes(cleanTerm) ||
                (s.description || '').toLowerCase().includes(cleanTerm)
              )
            })
            .slice(0, 6)
        : []

    const matchedAuthors =
      effectiveScope === 'all' || effectiveScope === 'authors'
        ? authors
            .filter((a) => {
              if (!cleanTerm) return true
              return (a.name || '').toLowerCase().includes(cleanTerm)
            })
            .slice(0, 6)
        : []

    const matchedPosts =
      (effectiveScope === 'all' || effectiveScope === 'posts') &&
      !isSubforumPrefix &&
      !isAuthorPrefix
        ? recentPosts
            .filter((p) => {
              if (!cleanTerm) return true
              return (
                (p.title || '').toLowerCase().includes(cleanTerm) ||
                (p.author || '').toLowerCase().includes(cleanTerm) ||
                (p.subforum || '').toLowerCase().includes(cleanTerm)
              )
            })
            .slice(0, cleanTerm ? 5 : 3)
        : []

    // Lista plana ordenada para navegación con flechas del teclado (↑ / ↓ / Enter / Tab)
    const flatItems = [
      ...matchedSubforums.map((s) => ({
        type: 'subforum',
        key: `ac-sub-${s.name}`,
        fillValue: `r/${s.name}`,
        data: s,
      })),
      ...matchedAuthors.map((a) => ({
        type: 'author',
        key: `ac-usr-${a.name}`,
        fillValue: `u/${a.name}`,
        data: a,
      })),
      ...matchedPosts.map((p) => ({
        type: 'post',
        key: `ac-post-${p.subforum}-${p.id}`,
        fillValue: p.title,
        data: p,
      })),
    ]

    return {
      cleanTerm,
      effectiveScope,
      matchedSubforums,
      matchedAuthors,
      matchedPosts,
      flatItems,
    }
  }, [searchQuery, searchScope, subforums, authors, recentPosts])

  // Reiniciar índice activo cuando cambian los resultados
  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchQuery, searchScope])

  const executeAutocompleteItem = (item) => {
    if (!item) return
    setIsSearchFocused(false)
    if (item.type === 'subforum') {
      if (onSelectSubforum) onSelectSubforum(item.data.name)
    } else if (item.type === 'author') {
      if (onSelectAuthor) onSelectAuthor(item.data.name)
    } else if (item.type === 'post') {
      if (onOpenPostDetail) {
        onOpenPostDetail(item.data.subforum, item.data.id)
      }
    }
  }

  const handleSearchKeyDown = (e) => {
    const items = autocompleteData.flatItems
    if (!isSearchFocused && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsSearchFocused(true)
      return
    }

    if (e.key === 'Escape') {
      setIsSearchFocused(false)
      searchInputRef.current?.blur()
      return
    }

    if (items.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + items.length) % items.length)
    } else if (e.key === 'Tab' && isSearchFocused && items[highlightedIndex]) {
      // Tab autocompleta el nombre del subforo o usuario en el input sin salir
      e.preventDefault()
      const target = items[highlightedIndex]
      if (onSearchChange) {
        onSearchChange(
          target.type === 'subforum'
            ? target.data.name
            : target.type === 'author'
              ? target.data.name
              : target.fillValue,
        )
      }
    } else if (e.key === 'Enter' && isSearchFocused && items[highlightedIndex]) {
      e.preventDefault()
      executeAutocompleteItem(items[highlightedIndex])
    }
  }

  const handleSaveIdentity = (e) => {
    e.preventDefault()
    const clean = aliasInput.trim()
    saveAuthor(clean)
    setActiveAlias(clean)
    setIsIdentityModalOpen(false)
    if (onNotify) {
      onNotify(
        clean ? `Identidad activa: u/${clean}` : 'Identidad activa restablecida',
      )
    }
  }

  return (
    <>
      <header className="glass-navbar">
        <div className="glass-navbar-inner">
          {/* Izquierda: Botón Menú Móvil + Logo Oficial LCC (https://cc.unison.mx/) + Escudo UNISON (https://www.unison.mx/) */}
          <div className="navbar-brand-group">
            <button
              type="button"
              className="mobile-menu-trigger-btn"
              onClick={onToggleMobileMenu}
              aria-label="Abrir menú de comunidades y perfiles"
              title="Menú de comunidades y perfiles"
            >
              ☰
            </button>
            <IconLogo size={40} linkToCareer />
            <IconUnisonLogo size={34} linkToUniversity />

            <div className="navbar-brand-text">
              <div
                className="brand-title"
                onClick={onNavigateHome}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onNavigateHome()
                }}
                title="Volver al Feed Principal de LCC-chan"
              >
                lcc-chan <span className="brand-tag">UNISON</span>
              </div>
              <div className="brand-dual-links">
                <a
                  href={LCC_OFFICIAL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="brand-career-link"
                  title="Portal oficial de Ciencias de la Computación (https://cc.unison.mx/)"
                >
                  cc.unison.mx ↗
                </a>
                <span className="brand-link-sep">•</span>
                <a
                  href={UNISON_OFFICIAL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="brand-unison-link"
                  title="Portal general de la Universidad de Sonora (https://www.unison.mx/)"
                >
                  unison.mx ↗
                </a>
              </div>
            </div>
          </div>

          {/* Centro: Buscador Global con Autocompletado en Vivo de Subforos, Usuarios y Posts */}
          <div className="reddit-navbar-center" ref={searchContainerRef}>
            <div
              className={`reddit-search-pill ${
                isSearchFocused ? 'search-pill-open' : ''
              }`}
            >
              <IconSearch size={17} />
              <input
                ref={searchInputRef}
                type="search"
                className="reddit-search-input"
                placeholder="Buscar o autocompletar r/subforos, u/usuarios o posts..."
                value={searchQuery || ''}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setIsSearchFocused(true)
                  if (onSearchChange) onSearchChange(e.target.value)
                }}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    if (onSearchChange) onSearchChange('')
                    searchInputRef.current?.focus()
                  }}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                className="search-cmd-trigger"
                onClick={onOpenCommandPalette}
                title="Abrir Paleta de Comandos Rápida (Ctrl + K)"
              >
                ⌘K
              </button>
            </div>

            {/* Panel Flotante de Autocompletado de Subforos, Usuarios y Publicaciones */}
            {isSearchFocused && (
              <div
                className="search-autocomplete-dropdown"
                role="listbox"
                aria-label="Sugerencias de autocompletado"
              >
                {/* Pestañas de Filtro Rápido dentro del Autocompletado */}
                <div className="autocomplete-tabs-bar">
                  <div className="autocomplete-tabs-group">
                    {[
                      { id: 'all', label: '✨ Todo' },
                      {
                        id: 'subforums',
                        label: `🌐 Subforos (${subforums.length})`,
                      },
                      {
                        id: 'authors',
                        label: `👤 Usuarios (${authors.length})`,
                      },
                      { id: 'posts', label: '📝 Posts' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`autocomplete-scope-chip ${
                          searchScope === tab.id ? 'active' : ''
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setSearchScope(tab.id)
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <span className="autocomplete-kbd-hint hide-mobile">
                    <kbd>↑↓</kbd> navegar • <kbd>Tab</kbd> completar •{' '}
                    <kbd>↵</kbd> ir
                  </span>
                </div>

                <div className="autocomplete-results-scroll">
                  {autocompleteData.flatItems.length === 0 ? (
                    <div className="autocomplete-empty-state">
                      <span>
                        No se encontraron subforos ni usuarios para{' '}
                        <strong>&ldquo;{searchQuery}&rdquo;</strong>
                      </span>
                      <small>
                        Prueba escribiendo <code>r/</code> para ver comunidades o{' '}
                        <code>u/</code> para ver autores.
                      </small>
                    </div>
                  ) : (
                    <>
                      {/* Sección 1: Autocompletado de Subforos / Comunidades */}
                      {autocompleteData.matchedSubforums.length > 0 && (
                        <div className="autocomplete-group">
                          <div className="autocomplete-group-header">
                            <span>COMUNIDADES / SUBFOROS</span>
                            <span className="autocomplete-group-count">
                              {autocompleteData.matchedSubforums.length}
                            </span>
                          </div>
                          {autocompleteData.matchedSubforums.map((sub) => {
                            const itemIdx =
                              autocompleteData.flatItems.findIndex(
                                (it) => it.key === `ac-sub-${sub.name}`,
                              )
                            const isActive = itemIdx === highlightedIndex
                            return (
                              <button
                                key={`ac-sub-${sub.name}`}
                                type="button"
                                className={`autocomplete-item ${
                                  isActive ? 'active' : ''
                                }`}
                                onMouseEnter={() =>
                                  setHighlightedIndex(itemIdx)
                                }
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  executeAutocompleteItem({
                                    type: 'subforum',
                                    data: sub,
                                  })
                                }}
                              >
                                <div className="autocomplete-item-left">
                                  <SubforumEmblem name={sub.name} size={28} />
                                  <div className="autocomplete-item-text">
                                    <div className="autocomplete-item-title">
                                      <span className="ac-prefix">r/</span>
                                      <HighlightMatch
                                        text={sub.name}
                                        query={searchQuery}
                                      />
                                    </div>
                                    <span className="autocomplete-item-sub">
                                      <HighlightMatch
                                        text={
                                          sub.description ||
                                          'Comunidad activa de LCC-chan'
                                        }
                                        query={searchQuery}
                                      />
                                    </span>
                                  </div>
                                </div>
                                <div className="autocomplete-item-right">
                                  <span className="autocomplete-pill-badge">
                                    {sub.postCount || 0} posts
                                  </span>
                                  <span className="autocomplete-action-arrow">
                                    Ir →
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Sección 2: Autocompletado de Usuarios / Perfiles */}
                      {autocompleteData.matchedAuthors.length > 0 && (
                        <div className="autocomplete-group">
                          <div className="autocomplete-group-header">
                            <span>USUARIOS Y PERFILES</span>
                            <span className="autocomplete-group-count">
                              {autocompleteData.matchedAuthors.length}
                            </span>
                          </div>
                          {autocompleteData.matchedAuthors.map((author) => {
                            const itemIdx =
                              autocompleteData.flatItems.findIndex(
                                (it) => it.key === `ac-usr-${author.name}`,
                              )
                            const isActive = itemIdx === highlightedIndex
                            return (
                              <button
                                key={`ac-usr-${author.name}`}
                                type="button"
                                className={`autocomplete-item ${
                                  isActive ? 'active' : ''
                                }`}
                                onMouseEnter={() =>
                                  setHighlightedIndex(itemIdx)
                                }
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  executeAutocompleteItem({
                                    type: 'author',
                                    data: author,
                                  })
                                }}
                              >
                                <div className="autocomplete-item-left">
                                  <UserAvatar name={author.name} size={28} />
                                  <div className="autocomplete-item-text">
                                    <div className="autocomplete-item-title">
                                      <span className="ac-prefix ac-prefix-user">
                                        u/
                                      </span>
                                      <HighlightMatch
                                        text={author.name}
                                        query={searchQuery}
                                      />
                                    </div>
                                    <span className="autocomplete-item-sub">
                                      Historial completo • {author.postCount}{' '}
                                      {author.postCount === 1
                                        ? 'publicación'
                                        : 'publicaciones'}
                                    </span>
                                  </div>
                                </div>
                                <div className="autocomplete-item-right">
                                  <span className="autocomplete-pill-badge ac-karma-badge">
                                    🔥{' '}
                                    {author.netKarma >= 0
                                      ? `+${author.netKarma}`
                                      : author.netKarma}{' '}
                                    karma
                                  </span>
                                  <span className="autocomplete-action-arrow">
                                    Perfil →
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Sección 3: Autocompletado de Publicaciones */}
                      {autocompleteData.matchedPosts.length > 0 && (
                        <div className="autocomplete-group">
                          <div className="autocomplete-group-header">
                            <span>PUBLICACIONES COINCIDENTES</span>
                            <span className="autocomplete-group-count">
                              {autocompleteData.matchedPosts.length}
                            </span>
                          </div>
                          {autocompleteData.matchedPosts.map((post) => {
                            const itemIdx =
                              autocompleteData.flatItems.findIndex(
                                (it) =>
                                  it.key ===
                                  `ac-post-${post.subforum}-${post.id}`,
                              )
                            const isActive = itemIdx === highlightedIndex
                            return (
                              <button
                                key={`ac-post-${post.subforum}-${post.id}`}
                                type="button"
                                className={`autocomplete-item ${
                                  isActive ? 'active' : ''
                                }`}
                                onMouseEnter={() =>
                                  setHighlightedIndex(itemIdx)
                                }
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  executeAutocompleteItem({
                                    type: 'post',
                                    data: post,
                                  })
                                }}
                              >
                                <div className="autocomplete-item-left">
                                  <SubforumEmblem
                                    name={post.subforum}
                                    size={24}
                                  />
                                  <div className="autocomplete-item-text">
                                    <div className="autocomplete-item-title">
                                      <HighlightMatch
                                        text={post.title}
                                        query={searchQuery}
                                      />
                                    </div>
                                    <span className="autocomplete-item-sub">
                                      en <strong>r/{post.subforum}</strong> • por{' '}
                                      u/{post.author}
                                    </span>
                                  </div>
                                </div>
                                <div className="autocomplete-item-right">
                                  <span className="autocomplete-pill-badge">
                                    ▲ {post.likes || 0}
                                  </span>
                                  <span className="autocomplete-action-arrow">
                                    Abrir →
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Derecha: Botones de dimensión fija para que la barra superior nunca cambie de tamaño */}
          <div className="reddit-navbar-right">
            {displayAlias && (
              <button
                type="button"
                className="glass-nav-pill nav-user-fixed-btn"
                onClick={() => onSelectAuthor && onSelectAuthor(displayAlias)}
                title={`Ver perfil e historial de publicaciones de u/${displayAlias}`}
              >
                <UserAvatar name={displayAlias} size={20} />
                <span className="nav-btn-truncate hide-mobile">
                  u/{displayAlias}
                </span>
              </button>
            )}

            <button
              type="button"
              className="glass-nav-pill"
              onClick={() => {
                setAliasInput(activeAlias)
                setIsIdentityModalOpen(true)
              }}
              title="Configurar tu alias activo para publicar y comentar"
            >
              <span>👤</span>
              <span className="hide-mobile">Alias</span>
            </button>

            <button
              type="button"
              className={`glass-nav-pill hide-mobile ${
                isTheaterMode ? 'pill-bookmarked' : ''
              }`}
              onClick={onToggleTheaterMode}
              title="Alternar Modo Teatro (Lectura Inmersiva a Pantalla Ancha)"
            >
              <span>{isTheaterMode ? '⤡ 3 Cols' : '⤢ Teatro'}</span>
            </button>

            <button
              type="button"
              className="glass-nav-pill nav-palette-fixed-btn"
              onClick={() => setIsDesignModalOpen(true)}
              title="Cambiar paleta de colores (10 temas disponibles)"
            >
              <span
                className="theme-indicator-dot"
                style={{ backgroundColor: currentPalette.dot }}
              />
              <IconPalette size={15} />
              <span className="nav-btn-truncate hide-mobile">
                {currentPalette.shortLabel}
              </span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm hide-xs"
              onClick={onOpenCreatePost}
              title="Publicar un nuevo post"
            >
              <IconPlus size={16} />
              <span className="hide-mobile">Publicar</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenCreateSubforum}
              title="Crear un nuevo subforo (POST /subforums)"
            >
              <IconPlus size={16} />
              <span>Subforo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Identidad Activa */}
      <Modal
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        size="sm"
        title="Tu Alias e Identidad en LCC-chan"
        subtitle="Elige el nombre de autor que se pre-llenará al publicar o comentar y marca tus publicaciones con la insignia TÚ."
      >
        <form onSubmit={handleSaveIdentity} className="form-stack">
          <div className="form-group">
            <label className="form-label" htmlFor="active-alias-input">
              Publicando como (<code>author</code>):
            </label>
            <input
              id="active-alias-input"
              type="text"
              className="form-input"
              placeholder="Ej. Diego Torres"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              maxLength={50}
            />
          </div>

          {authors.length > 0 && (
            <div className="form-group">
              <span className="form-label">
                O selecciona un usuario existente para explorar su perfil:
              </span>
              <div className="filter-chips">
                {authors.map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    className={`filter-chip ${
                      aliasInput.toLowerCase() === a.name.toLowerCase()
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => setAliasInput(a.name)}
                  >
                    u/{a.name} ({a.postCount})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer-split">
            {aliasInput.trim() && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const clean = aliasInput.trim()
                  saveAuthor(clean)
                  setIsIdentityModalOpen(false)
                  if (onSelectAuthor) onSelectAuthor(clean)
                }}
              >
                Ver perfil de u/{aliasInput.trim()} →
              </button>
            )}
            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsIdentityModalOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar alias
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Apariencia con las 10 Paletas */}
      <Modal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        size="lg"
        title="Estudio Visual Glassmorphism — 10 Paletas"
        subtitle="Selecciona cualquiera de las 10 paletas translúcidas de alta legibilidad."
      >
        <div className="design-studio-stack">
          <div>
            <h4 className="studio-section-title">10 Paletas de Colores</h4>
            <div className="palettes-grid-clean">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`palette-option-card ${theme === p.id ? 'active' : ''}`}
                  onClick={() => onThemeChange(p.id)}
                >
                  <div className="palette-option-header">
                    <span className="palette-option-title">{p.label}</span>
                    <div className="palette-swatches">
                      {p.colors.map((hex) => (
                        <span
                          key={hex}
                          className="swatch-circle"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="palette-option-desc">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="studio-section-title">Densidad de Tarjetas</h4>
            <div className="layouts-grid-clean">
              {LAYOUT_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`palette-option-card ${layout === m.id ? 'active' : ''}`}
                  onClick={() => onLayoutChange(m.id)}
                >
                  <strong className="palette-option-title">{m.label}</strong>
                  <span className="palette-option-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsDesignModalOpen(false)}
            >
              Aplicar
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
