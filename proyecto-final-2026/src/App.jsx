import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import RightRail from './components/layout/RightRail'
import SubforumFormModal from './components/subforums/SubforumFormModal'
import PostFormModal from './components/posts/PostFormModal'
import CommandPaletteModal from './components/ui/CommandPaletteModal'
import {
  IconFlame,
  IconLogo,
  IconPlus,
  IconSparkles,
  IconUnisonLogo,
  LCC_OFFICIAL_URL,
  UNISON_OFFICIAL_URL,
} from './components/ui/ForumIcons'
import HomePage from './pages/HomePage'
import SubforumPage from './pages/SubforumPage'
import PostDetailPage from './pages/PostDetailPage'
import UserProfilePage from './pages/UserProfilePage'
import { getSubforums, createSubforum } from './services/subforumsService'
import { createPost, getPostsBySubforum } from './services/postsService'
import {
  getSavedBookmarks,
  getSavedTheme,
  saveTheme,
  getSavedLayout,
  saveLayout,
} from './utils/storage'

/**
 * Parsea el hash de la URL:
 * - #/ -> { view: 'home' }
 * - #/r/:name -> { view: 'subforum', subforumName }
 * - #/r/:name/posts/:postId -> { view: 'post', subforumName, postId }
 * - #/u/:author -> { view: 'profile', authorName }
 */
function parseHashRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/'

  const userMatch = hash.match(/^\/u\/([^/]+)$/)
  if (userMatch) {
    return {
      view: 'profile',
      authorName: decodeURIComponent(userMatch[1]),
    }
  }

  const postMatch = hash.match(/^\/r\/([^/]+)\/posts\/(\d+)$/)
  if (postMatch) {
    return {
      view: 'post',
      subforumName: decodeURIComponent(postMatch[1]),
      postId: Number(postMatch[2]),
    }
  }

  const subMatch = hash.match(/^\/r\/([^/]+)$/)
  if (subMatch) {
    return {
      view: 'subforum',
      subforumName: decodeURIComponent(subMatch[1]),
    }
  }

  return { view: 'home' }
}

export default function App() {
  const [route, setRoute] = useState(parseHashRoute)
  const [homeTab, setHomeTab] = useState('for-you')
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState(getSavedTheme)
  const [layout, setLayout] = useState(getSavedLayout)
  const [sidebarSubforums, setSidebarSubforums] = useState([])
  const [railRecentPosts, setRailRecentPosts] = useState([])
  const [bookmarksCount, setBookmarksCount] = useState(
    () => getSavedBookmarks().length,
  )
  const [isCreateSubforumOpen, setIsCreateSubforumOpen] = useState(false)
  const [isGlobalCreatePostOpen, setIsGlobalCreatePostOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [toastMessage, setToastMessage] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const notify = useCallback((text) => {
    setToastMessage(text)
  }, [])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = setTimeout(() => setToastMessage(null), 3200)
    return () => clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute())
    const onBookmarksUpdate = (e) => {
      const list = e.detail || getSavedBookmarks()
      setBookmarksCount(list.length)
    }
    const onGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
    }
    const onWindowScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
      setScrollProgress(pct)
      setShowScrollTop(scrollTop > 340)
    }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('lcc-bookmarks-changed', onBookmarksUpdate)
    window.addEventListener('keydown', onGlobalKeyDown)
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('lcc-bookmarks-changed', onBookmarksUpdate)
      window.removeEventListener('keydown', onGlobalKeyDown)
      window.removeEventListener('scroll', onWindowScroll)
    }
  }, [])

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const loadSidebarAndRecent = useCallback(async () => {
    try {
      const res = await getSubforums({
        page: 1,
        limit: 50,
        sortBy: 'lastActivity',
        order: 'desc',
      })
      const list = res.data || []
      setSidebarSubforums(list)

      if (list.length > 0) {
        const postLists = await Promise.all(
          list.map((s) =>
            getPostsBySubforum(s.name, {
              page: 1,
              limit: 20,
              sortBy: 'date',
              order: 'desc',
            }).catch(() => ({ data: [] })),
          ),
        )
        const merged = postLists
          .flatMap((r) => r.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setRailRecentPosts(merged)
      }
    } catch {
      // Manejado en la vista principal
    }
  }, [])

  useEffect(() => {
    loadSidebarAndRecent()
  }, [loadSidebarAndRecent, refreshTrigger])

  // Sincronización silenciosa en segundo plano cada 25s para uso multi-usuario simultáneo
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadSidebarAndRecent()
      }
    }, 25000)
    return () => clearInterval(interval)
  }, [loadSidebarAndRecent])

  // Calcular lista de autores con su conteo de posts y Karma Neto para Podio y Perfiles 1-Clic
  const activeAuthors = useMemo(() => {
    const map = new Map()
    for (const post of railRecentPosts) {
      const rawName = (post.author || '').trim()
      if (!rawName) continue
      const key = rawName.toLowerCase()
      const prev = map.get(key) || {
        name: rawName,
        postCount: 0,
        totalLikes: 0,
        totalDislikes: 0,
        netKarma: 0,
      }
      prev.postCount += 1
      prev.totalLikes += post.likes || 0
      prev.totalDislikes += post.dislikes || 0
      prev.netKarma = prev.totalLikes - prev.totalDislikes
      map.set(key, prev)
    }
    return Array.from(map.values()).sort(
      (a, b) => b.netKarma - a.netKarma || b.postCount - a.postCount,
    )
  }, [railRecentPosts])

  const navigateHome = () => {
    window.location.hash = '/'
    setRoute({ view: 'home' })
    setIsMobileDrawerOpen(false)
  }

  const navigateToSubforum = (name) => {
    window.location.hash = `/r/${encodeURIComponent(name)}`
    setRoute({ view: 'subforum', subforumName: name })
    setIsMobileDrawerOpen(false)
  }

  const navigateToPostDetail = (name, postId) => {
    window.location.hash = `/r/${encodeURIComponent(name)}/posts/${encodeURIComponent(postId)}`
    setRoute({ view: 'post', subforumName: name, postId: Number(postId) })
    setIsMobileDrawerOpen(false)
  }

  const navigateToAuthorProfile = (authorName) => {
    if (!authorName) return
    window.location.hash = `/u/${encodeURIComponent(authorName)}`
    setRoute({ view: 'profile', authorName })
    setIsMobileDrawerOpen(false)
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    saveTheme(newTheme)
    notify(`Paleta aplicada: ${newTheme}`)
  }

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout)
    saveLayout(newLayout)
    notify(`Vista aplicada: ${newLayout}`)
  }

  const handleCreateSubforum = async ({ name, description }) => {
    const created = await createSubforum({ name, description })
    triggerRefresh()
    notify(`Comunidad r/${created.name} creada`)
    navigateToSubforum(created.name)
  }

  const defaultTargetSubforum =
    route.subforumName ||
    sidebarSubforums.find((s) => s.postCount > 0)?.name ||
    sidebarSubforums[0]?.name ||
    'pruebas'

  const handleGlobalCreatePost = async (payload, chosenSubforum) => {
    const targetSub = chosenSubforum || defaultTargetSubforum
    await createPost(targetSub, payload)
    triggerRefresh()
    notify(`Post publicado en r/${targetSub}`)
  }

  return (
    <div className="app-shell">
      {/* Barra Superior Luminosa de Progreso de Lectura */}
      <div className="scroll-progress-track" aria-hidden="true">
        <div
          className="scroll-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Orbes de luz ambiental y malla de fondo animada para el efecto Glassmorphism */}
      <div className="ambient-canvas" aria-hidden="true">
        <div className="ambient-grid-overlay" />
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      <Navbar
        theme={theme}
        onThemeChange={handleThemeChange}
        layout={layout}
        onLayoutChange={handleLayoutChange}
        isTheaterMode={isTheaterMode}
        onToggleTheaterMode={() => {
          setIsTheaterMode((prev) => {
            const next = !prev
            notify(next ? 'Modo Teatro Ancho activado' : 'Vista de 3 columnas restaurada')
            return next
          })
        }}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val)
          if (route.view !== 'home') {
            navigateHome()
          }
        }}
        subforums={sidebarSubforums}
        recentPosts={railRecentPosts}
        authors={activeAuthors}
        onSelectSubforum={navigateToSubforum}
        onOpenPostDetail={navigateToPostDetail}
        onSelectAuthor={navigateToAuthorProfile}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNavigateHome={navigateHome}
        onOpenCreatePost={() => setIsGlobalCreatePostOpen(true)}
        onOpenCreateSubforum={() => setIsCreateSubforumOpen(true)}
        onToggleMobileMenu={() => setIsMobileDrawerOpen((prev) => !prev)}
        onNotify={notify}
      />

      <div className={`app-layout ${isTheaterMode ? 'app-layout-theater' : ''}`}>
        {isMobileDrawerOpen && (
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          subforums={sidebarSubforums}
          authors={activeAuthors}
          bookmarksCount={bookmarksCount}
          activeSubforumName={route.subforumName || null}
          activeAuthorName={route.authorName || null}
          homeTab={homeTab}
          onSelectHomeTab={(tab) => {
            setHomeTab(tab)
            setIsMobileDrawerOpen(false)
          }}
          onSelectSubforum={navigateToSubforum}
          onSelectAuthor={navigateToAuthorProfile}
          onNavigateHome={navigateHome}
          onOpenCreateSubforum={() => {
            setIsMobileDrawerOpen(false)
            setIsCreateSubforumOpen(true)
          }}
          isMobileOpen={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        <main className="main-content">
          {route.view === 'home' && (
            <HomePage
              activeTab={homeTab}
              onChangeTab={setHomeTab}
              searchQuery={searchQuery}
              onSelectSubforum={navigateToSubforum}
              onOpenPostDetail={navigateToPostDetail}
              onSelectAuthor={navigateToAuthorProfile}
              onOpenCreateSubforum={() => setIsCreateSubforumOpen(true)}
              refreshTrigger={refreshTrigger}
              layout={layout}
              onLayoutChange={handleLayoutChange}
              onSubforumsLoaded={setSidebarSubforums}
              onRecentPostsLoaded={setRailRecentPosts}
              onNotify={notify}
            />
          )}

          {route.view === 'subforum' && (
            <SubforumPage
              subforumName={route.subforumName}
              onBackHome={navigateHome}
              onOpenPostDetail={navigateToPostDetail}
              onSelectAuthor={navigateToAuthorProfile}
              refreshTrigger={refreshTrigger}
              onSubforumUpdated={triggerRefresh}
              layout={layout}
              onNotify={notify}
            />
          )}

          {route.view === 'post' && (
            <PostDetailPage
              subforumName={route.subforumName}
              postId={route.postId}
              onBackToSubforum={navigateToSubforum}
              onBackHome={navigateHome}
              onSelectAuthor={navigateToAuthorProfile}
              refreshTrigger={refreshTrigger}
              onPostDeleted={triggerRefresh}
              onNotify={notify}
            />
          )}

          {route.view === 'profile' && (
            <UserProfilePage
              authorName={route.authorName}
              onBackHome={navigateHome}
              onSelectSubforum={navigateToSubforum}
              onOpenPostDetail={navigateToPostDetail}
              onSelectAuthor={navigateToAuthorProfile}
              refreshTrigger={refreshTrigger}
              layout={layout}
              onNotify={notify}
            />
          )}
        </main>

        <RightRail
          subforums={sidebarSubforums}
          recentPosts={railRecentPosts}
          authors={activeAuthors}
          activeSubforumName={route.subforumName || null}
          activeAuthorName={route.authorName || null}
          onSelectSubforum={navigateToSubforum}
          onOpenPostDetail={navigateToPostDetail}
          onSelectAuthor={navigateToAuthorProfile}
          onOpenCreateSubforum={() => setIsCreateSubforumOpen(true)}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
      </div>

      {/* Pie de Página Institucional Glassmorphism — Universidad de Sonora & LCC */}
      <footer className="glass-institutional-footer">
        <div className="glass-footer-inner">
          <div className="glass-footer-brand">
            <IconLogo size={36} linkToCareer />
            <IconUnisonLogo size={36} linkToUniversity />
            <div className="glass-footer-titles">
              <strong>
                LCC-chan • Licenciatura en Ciencias de la Computación
              </strong>
              <span>
                Universidad de Sonora (UNISON) • &ldquo;El Saber de mis Hijos hará mi
                Grandeza&rdquo;
              </span>
            </div>
          </div>

          <div className="glass-footer-links">
            <a
              href={LCC_OFFICIAL_URL}
              target="_blank"
              rel="noreferrer"
              className="footer-portal-pill"
            >
              🦅 Portal Carrera LCC (cc.unison.mx) ↗
            </a>
            <a
              href={UNISON_OFFICIAL_URL}
              target="_blank"
              rel="noreferrer"
              className="footer-portal-pill footer-portal-unison"
            >
              🏛️ Portal Universidad de Sonora (unison.mx) ↗
            </a>
          </div>

          <div className="glass-footer-shortcuts">
            <span>
              <kbd>Ctrl+K</kbd> Comandos
            </span>
            <span>
              <kbd>↑↓</kbd> + <kbd>Tab</kbd> Autocompletar búsqueda
            </span>
            <span>
              <kbd>Esc</kbd> Cerrar paneles
            </span>
          </div>
        </div>
      </footer>

      <SubforumFormModal
        isOpen={isCreateSubforumOpen}
        onClose={() => setIsCreateSubforumOpen(false)}
        onSubmit={handleCreateSubforum}
      />

      <PostFormModal
        isOpen={isGlobalCreatePostOpen}
        onClose={() => setIsGlobalCreatePostOpen(false)}
        subforumName={route.subforumName || ''}
        subforums={sidebarSubforums}
        onSubmit={handleGlobalCreatePost}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        subforums={sidebarSubforums}
        authors={activeAuthors}
        onNavigateHome={() => {
          navigateHome()
          setHomeTab('for-you')
        }}
        onOpenSavedTab={() => {
          navigateHome()
          setHomeTab('saved')
        }}
        onOpenCreatePost={() => setIsGlobalCreatePostOpen(true)}
        onOpenCreateSubforum={() => setIsCreateSubforumOpen(true)}
        onSelectSubforum={navigateToSubforum}
        onSelectAuthor={navigateToAuthorProfile}
        onThemeChange={handleThemeChange}
      />

      {/* Barra Inferior Flotante de Navegación Móvil (Solo visible en <= 860px) */}
      <nav className="mobile-bottom-dock" aria-label="Navegación móvil rápida">
        <button
          type="button"
          className={`mobile-dock-item ${
            route.view === 'home' && homeTab === 'for-you' && !isMobileDrawerOpen
              ? 'active'
              : ''
          }`}
          onClick={() => {
            navigateHome()
            setHomeTab('for-you')
          }}
        >
          <IconSparkles size={17} />
          <span>Inicio</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-item ${
            route.view === 'home' && homeTab === 'popular' && !isMobileDrawerOpen
              ? 'active'
              : ''
          }`}
          onClick={() => {
            navigateHome()
            setHomeTab('popular')
          }}
        >
          <IconFlame size={17} />
          <span>Popular</span>
        </button>

        <button
          type="button"
          className="mobile-dock-item mobile-dock-publish"
          onClick={() => setIsGlobalCreatePostOpen(true)}
        >
          <span className="mobile-dock-plus">
            <IconPlus size={16} />
          </span>
          <span>Publicar</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-item ${
            route.view === 'home' && homeTab === 'saved' && !isMobileDrawerOpen
              ? 'active'
              : ''
          }`}
          onClick={() => {
            navigateHome()
            setHomeTab('saved')
          }}
        >
          <span className="mobile-dock-icon">🔖</span>
          <span>Guardados{bookmarksCount > 0 ? ` (${bookmarksCount})` : ''}</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-item ${isMobileDrawerOpen ? 'active' : ''}`}
          onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
        >
          <span className="mobile-dock-icon">☰</span>
          <span>Menú</span>
        </button>
      </nav>

      {/* Botón Flotante Glass para Volver Arriba */}
      {showScrollTop && (
        <button
          type="button"
          className="scroll-top-fab"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Subir al inicio de la página"
        >
          ↑
        </button>
      )}

      {toastMessage && (
        <div className="toast-viewport" role="status" aria-live="polite">
          <div className="toast-glass">
            <span className="toast-dot" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}
