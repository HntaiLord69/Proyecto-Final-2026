import { useState, useEffect, useMemo } from 'react'
import { PALETTES } from '../layout/Navbar'
import { IconSearch, SubforumEmblem } from './ForumIcons'

export default function CommandPaletteModal({
  isOpen,
  onClose,
  subforums = [],
  authors = [],
  onNavigateHome,
  onOpenSavedTab,
  onOpenCreatePost,
  onOpenCreateSubforum,
  onSelectSubforum,
  onSelectAuthor,
  onThemeChange,
}) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQuery('')
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        }
      } else if (isOpen && e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = [
      {
        id: 'act-post',
        group: 'Acciones Rápidas',
        label: '+ Crear nueva Publicación (Post)',
        badge: 'POST',
        action: onOpenCreatePost,
      },
      {
        id: 'act-sub',
        group: 'Acciones Rápidas',
        label: '+ Crear nuevo Subforo (Comunidad)',
        badge: 'SUBFORO',
        action: onOpenCreateSubforum,
      },
      {
        id: 'act-home',
        group: 'Acciones Rápidas',
        label: '🏠 Ir al Feed Principal (Para Ti)',
        badge: 'HOME',
        action: onNavigateHome,
      },
      {
        id: 'act-saved',
        group: 'Acciones Rápidas',
        label: '🔖 Ver mis Publicaciones Guardadas',
        badge: 'FAVORITOS',
        action: onOpenSavedTab,
      },
      ...subforums.map((s) => ({
        id: `sub-${s.name}`,
        group: 'Comunidades (Subforos)',
        label: `r/${s.name}`,
        sub: s.description,
        subforumName: s.name,
        badge: `${s.postCount} posts`,
        action: () => onSelectSubforum(s.name),
      })),
      ...authors.map((a) => ({
        id: `usr-${a.name}`,
        group: 'Perfiles de Usuarios (1-Clic)',
        label: `u/${a.name}`,
        authorInitial: a.name.charAt(0).toUpperCase(),
        badge: `${a.postCount} posts • 👍 ${a.totalLikes}`,
        action: () => onSelectAuthor(a.name),
      })),
      ...PALETTES.map((p) => ({
        id: `thm-${p.id}`,
        group: 'Cambiar Paleta Visual',
        label: `Tema: ${p.shortLabel}`,
        colorDot: p.dot,
        badge: p.id,
        action: () => onThemeChange(p.id),
      })),
    ]

    if (!q) return all
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        (item.sub && item.sub.toLowerCase().includes(q)),
    )
  }, [
    query,
    subforums,
    authors,
    onOpenCreatePost,
    onOpenCreateSubforum,
    onNavigateHome,
    onOpenSavedTab,
    onSelectSubforum,
    onSelectAuthor,
    onThemeChange,
  ])

  if (!isOpen) return null

  const groups = Array.from(new Set(items.map((i) => i.group)))

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="cmd-palette-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmd-palette-search">
          <IconSearch size={18} />
          <input
            type="search"
            className="cmd-palette-input"
            placeholder="Escribe un comando, r/subforo, u/usuario o paleta..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        <div className="cmd-palette-list">
          {items.length === 0 ? (
            <div className="cmd-palette-empty">
              No se encontraron comandos ni destinos para &ldquo;{query}&rdquo;
            </div>
          ) : (
            groups.map((grp) => (
              <div key={grp} className="cmd-group">
                <div className="cmd-group-title">{grp}</div>
                {items
                  .filter((i) => i.group === grp)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="cmd-item"
                      onClick={() => {
                        item.action()
                        onClose()
                      }}
                    >
                      <div className="cmd-item-left">
                        {item.subforumName && (
                          <SubforumEmblem name={item.subforumName} size={22} />
                        )}
                        {item.authorInitial && (
                          <span className="author-avatar author-avatar-sm">
                            {item.authorInitial}
                          </span>
                        )}
                        {item.colorDot && (
                          <span
                            className="reddit-theme-swatch"
                            style={{ backgroundColor: item.colorDot }}
                          />
                        )}
                        <span className="cmd-item-label">{item.label}</span>
                      </div>
                      <span className="cmd-item-badge">{item.badge}</span>
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
