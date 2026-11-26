/**
 * Colección de Iconos Vectoriales SVG e Ilustraciones personalizadas para LCC-chan.
 * Se adaptan dinámicamente a las paletas Tokyo Night, Gruvbox, Reddit y Catppuccin
 * utilizando `currentColor` y gradientes del tema activo.
 */

export const LCC_OFFICIAL_URL = 'https://cc.unison.mx/'
export const UNISON_OFFICIAL_URL = 'https://www.unison.mx/'

/**
 * Logotipo Oficial de la Licenciatura en Ciencias de la Computación (LCC - UNISON)
 * recortado en PNG transparente (sin fondo blanco) y con contorno adaptativo
 * para verse nítido tanto en temas oscuros como claros.
 */
export function IconLogo({ size = 40, linkToCareer = false }) {
  const imgElement = (
    <img
      src="/lcc-logo.png"
      alt="Logo Licenciatura en Ciencias de la Computación UNISON"
      width={size}
      height={size}
      className="lcc-official-logo-img"
      style={{ width: size, height: size }}
    />
  )

  if (linkToCareer) {
    return (
      <a
        href={LCC_OFFICIAL_URL}
        target="_blank"
        rel="noreferrer"
        className="lcc-logo-link"
        onClick={(e) => e.stopPropagation()}
        title="Visitar página oficial de la Licenciatura en Ciencias de la Computación — UNISON (https://cc.unison.mx/)"
      >
        {imgElement}
      </a>
    )
  }

  return imgElement
}

/**
 * Escudo Oficial de la Universidad de Sonora (UNISON - "Todo lo Iluminan • 1942")
 * con exterior transparente y enlace directo a https://www.unison.mx/
 */
export function IconUnisonLogo({ size = 40, linkToUniversity = false }) {
  const imgElement = (
    <img
      src="/unison-logo.png"
      alt="Escudo Oficial Universidad de Sonora (UNISON)"
      width={size}
      height={size}
      className="unison-official-logo-img"
      style={{ width: size, height: size }}
    />
  )

  if (linkToUniversity) {
    return (
      <a
        href={UNISON_OFFICIAL_URL}
        target="_blank"
        rel="noreferrer"
        className="unison-logo-link"
        onClick={(e) => e.stopPropagation()}
        title="Visitar portal general de la Universidad de Sonora — UNISON (https://www.unison.mx/)"
      >
        {imgElement}
      </a>
    )
  }

  return imgElement
}

export function IconUpvote({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4L4 13H9V20H15V13H20L12 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconDownvote({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20L20 11H15V4H9V11H4L12 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconComment({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M21 11.5C21 16.1944 16.9706 20 12 20C10.5887 20 9.2531 19.6929 8.0645 19.1462L3 20.5L4.455 16.135C3.532 14.7883 3 13.2015 3 11.5C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconImage({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="8.5" cy="9.5" r="1.8" fill="currentColor" />
      <path
        d="M21 15L16.2 10.5L7 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconPlus({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconEdit({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M16.5 3.5C17.3284 2.67157 18.6716 2.67157 19.5 3.5C20.3284 4.32843 20.3284 5.67157 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconTrash({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 6H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconSearch({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20L16.35 16.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconFilter({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6H20M7 12H17M10 18H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconPalette({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C13.3807 21 14.5 19.8807 14.5 18.5C14.5 17.87 14.26 17.31 13.88 16.87C13.52 16.45 13.3 15.92 13.3 15.3C13.3 13.9745 14.3745 12.9 15.7 12.9H17.4C19.3882 12.9 21 11.2882 21 9.3C21 5.82061 16.9706 3 12 3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="7.5" cy="10.5" r="1.3" fill="currentColor" />
      <circle cx="11.5" cy="7.5" r="1.3" fill="currentColor" />
      <circle cx="16" cy="9.5" r="1.3" fill="currentColor" />
    </svg>
  )
}

export function IconFlame({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22C16.4183 22 20 18.6421 20 14.5C20 11.5 18 8.5 15 6.5C15.5 9 14 10.5 13 10.5C12.5 7 10 3.5 8 2C8.5 5.5 6 8 5 10.5C4.3 12.2 4 13.3 4 14.5C4 18.6421 7.58172 22 12 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconSparkles({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L14.2 8.8L20 11L14.2 13.2L12 19L9.8 13.2L4 11L9.8 8.8L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Genera un emblema SVG único para cada subforo basado en su nombre
 */
export function SubforumEmblem({ name = 'lcc', size = 42 }) {
  const palettes = [
    ['#7aa2f7', '#bb9af7'],
    ['#fe8019', '#fabd2f'],
    ['#ff4500', '#ff8717'],
    ['#9ece6a', '#73daca'],
    ['#f7768e', '#ff9e64'],
  ]
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const [c1, c2] = palettes[hash % palettes.length]
  const initials = name
    .split('-')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="subforum-emblem"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
    >
      <span>{initials || 'R/'}</span>
    </div>
  )
}

/**
 * Ilustración decorativa interactiva para la cabecera del foro con ambos emblemas oficiales:
 * - Logo Principal LCC -> https://cc.unison.mx/
 * - Escudo Oficial UNISON -> https://www.unison.mx/
 */
export function HeroArtwork() {
  return (
    <div className="hero-institutional-cluster">
      <a
        href={LCC_OFFICIAL_URL}
        target="_blank"
        rel="noreferrer"
        className="hero-lcc-showcase"
        title="Haz clic para ir al portal oficial de la Licenciatura en Ciencias de la Computación (https://cc.unison.mx/)"
      >
        <div className="hero-lcc-glass-orb svg-float-slow">
          <img
            src="/lcc-logo.png"
            alt="Logo Oficial LCC UNISON"
            className="hero-lcc-main-logo"
          />
        </div>
        <div className="hero-lcc-caption svg-float-delayed">
          <strong>LCC • UNISON</strong>
          <span>cc.unison.mx ↗</span>
        </div>
      </a>

      <a
        href={UNISON_OFFICIAL_URL}
        target="_blank"
        rel="noreferrer"
        className="hero-unison-satellite svg-float-delayed"
        title="Haz clic para ir al portal general de la Universidad de Sonora (https://www.unison.mx/)"
      >
        <img
          src="/unison-logo.png"
          alt="Escudo Oficial Universidad de Sonora"
          className="hero-unison-shield-img"
        />
        <span className="hero-unison-pill-label">unison.mx ↗</span>
      </a>
    </div>
  )
}


/**
 * Avatar Vectorial Generativo Único para cada Usuario (Geometric SVG Avatar + Aro de Karma).
 * Genera colores, anillos orbitales y patrones deterministas a partir del nombre del autor.
 */
export function UserAvatar({ name = 'Anónimo', size = 24, showRing = true }) {
  const palettes = [
    ['#7aa2f7', '#bb9af7', '#2ac3de'],
    ['#ff4500', '#ff8717', '#ffd166'],
    ['#9ece6a', '#73daca', '#2ac3de'],
    ['#f7768e', '#bb9af7', '#ff9e64'],
    ['#cba6f7', '#89b4fa', '#f5c2e7'],
    ['#fe8019', '#fabd2f', '#b8bb26'],
  ]

  const clean = (name || 'U').trim()
  const hash = clean.split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0)
  const [c1, c2, c3] = palettes[hash % palettes.length]
  const initials = clean
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const gradId = `usr-grad-${hash}-${size}`

  return (
    <span
      className={`generative-user-avatar ${showRing ? 'avatar-with-ring' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill={`url(#${gradId})`} />
        <circle
          cx="20"
          cy="20"
          r="15.5"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1.2"
          strokeDasharray={hash % 2 === 0 ? '4 2' : 'none'}
        />
        <circle
          cx={12 + (hash % 16)}
          cy={10 + ((hash >> 2) % 12)}
          r="6"
          fill={c3}
          opacity="0.32"
        />
      </svg>
      <span
        className="generative-avatar-initials"
        style={{ fontSize: Math.max(9, Math.round(size * 0.42)) }}
      >
        {initials || 'U'}
      </span>
    </span>
  )
}

/**
 * Arte Vectorial Panorámico Generativo para Cabeceras de Subforos y Perfiles.
 */
export function CommunityBannerArt({ seed = 'lcc-chan' }) {
  const hash = (seed || 'lcc')
    .split('')
    .reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 3), 0)

  const palettes = [
    ['#1e1b4b', '#4338ca', '#7aa2f7', '#bb9af7'],
    ['#3b0d0c', '#9a3412', '#ff4500', '#ffb000'],
    ['#062e22', '#047857', '#10b981', '#73daca'],
    ['#2e1065', '#6d28d9', '#cba6f7', '#f7768e'],
    ['#271709', '#92400e', '#fe8019', '#fabd2f'],
  ]
  const [bg1, bg2, acc1, acc2] = palettes[hash % palettes.length]
  const bannerId = `banner-${hash}`

  return (
    <svg
      className="community-banner-svg"
      viewBox="0 0 900 140"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={bannerId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="55%" stopColor={bg2} />
          <stop offset="100%" stopColor={acc1} />
        </linearGradient>
      </defs>
      <rect width="900" height="140" fill={`url(#${bannerId})`} />
      <path
        d="M0 95 C 220 35, 420 145, 660 75 C 770 40, 840 85, 900 60 L 900 140 L 0 140 Z"
        fill={acc1}
        opacity="0.25"
      />
      <path
        d="M0 115 C 180 65, 480 135, 720 85 C 810 65, 860 95, 900 80 L 900 140 L 0 140 Z"
        fill={acc2}
        opacity="0.22"
      />
      <circle cx={140 + (hash % 120)} cy="42" r="55" fill={acc2} opacity="0.18" />
      <circle cx={680 - (hash % 110)} cy="35" r="70" fill="#ffffff" opacity="0.08" />
      <circle cx="460" cy="70" r="35" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="2" />
    </svg>
  )
}
