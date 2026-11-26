import { useState } from 'react'

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="rich-code-block" onClick={(e) => e.stopPropagation()}>
      <div className="rich-code-header">
        <span className="rich-code-lang">{lang || 'código'}</span>
        <button
          type="button"
          className="rich-code-copy"
          onClick={handleCopy}
          title="Copiar fragmento de código"
        >
          {copied ? '✓ Copiado' : '📋 Copiar código'}
        </button>
      </div>
      <pre className="rich-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/**
 * Parsea texto en línea para convertir:
 * - `código inline`
 * - URLs (https://... o http://...) -> Píldoras de enlace externo clicables
 * - Menciones r/subforo -> Chip clicable al subforo
 * - Menciones u/autor o @autor -> Chip clicable al perfil del usuario
 */
function renderInlineTokens(text, { onSelectSubforum, onSelectAuthor }, keyPrefix = 't') {
  if (!text) return null

  // Expresión regular combinada para `inline code`, URLs, r/subforo y u/usuario
  const tokenRegex =
    /(`[^`\n]+`|https?:\/\/[^\s<>"')]+|(?:\b|^)r\/[a-z0-9-]{3,40}\b|(?:\b|^)u\/[A-Za-z0-9_ÁÉÍÓÚáéíóúñÑ-]{2,40}\b)/g

  const parts = text.split(tokenRegex)

  return parts.map((part, idx) => {
    if (!part) return null
    const key = `${keyPrefix}-${idx}`

    // 1. Código en línea `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="rich-inline-code">
          {part.slice(1, -1)}
        </code>
      )
    }

    // 2. Enlace externo http:// o https://
    if (/^https?:\/\//i.test(part)) {
      let hostLabel = part
      try {
        const u = new URL(part)
        hostLabel = u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname : '')
        if (hostLabel.length > 38) hostLabel = `${hostLabel.slice(0, 36)}…`
      } catch {
        hostLabel = part
      }

      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="rich-ext-link"
          onClick={(e) => e.stopPropagation()}
          title={`Abrir enlace externo: ${part}`}
        >
          <span>🔗 {hostLabel}</span>
          <span className="ext-arrow">↗</span>
        </a>
      )
    }

    // 3. Mención a subforo r/nombre
    if (/^r\/[a-z0-9-]{3,40}$/.test(part)) {
      const subName = part.slice(2)
      return (
        <button
          key={key}
          type="button"
          className="rich-mention-chip rich-mention-sub"
          onClick={(e) => {
            e.stopPropagation()
            if (onSelectSubforum) onSelectSubforum(subName)
          }}
          title={`Ir al subforo r/${subName}`}
        >
          {part}
        </button>
      )
    }

    // 4. Mención a usuario u/autor
    if (/^u\/[A-Za-z0-9_ÁÉÍÓÚáéíóúñÑ-]{2,40}$/.test(part)) {
      const authorName = part.slice(2)
      return (
        <button
          key={key}
          type="button"
          className="rich-mention-chip rich-mention-user"
          onClick={(e) => {
            e.stopPropagation()
            if (onSelectAuthor) onSelectAuthor(authorName)
          }}
          title={`Ver perfil de u/${authorName}`}
        >
          {part}
        </button>
      )
    }

    return part
  })
}

export default function RichContentRenderer({
  content = '',
  onSelectSubforum,
  onSelectAuthor,
}) {
  if (!content) return null

  // Separar bloques de código ```lang ... ``` del resto del texto
  const blockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g
  const segments = []
  let lastIndex = 0
  let match

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: content.slice(lastIndex, match.index),
      })
    }
    segments.push({
      type: 'code',
      lang: match[1] || 'code',
      value: match[2].replace(/\n$/, ''),
    })
    lastIndex = blockRegex.lastIndex
  }

  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      value: content.slice(lastIndex),
    })
  }

  return (
    <div className="rich-content-body">
      {segments.map((seg, i) => {
        if (seg.type === 'code') {
          return <CodeBlock key={`code-${i}`} lang={seg.lang} code={seg.value} />
        }
        return (
          <span key={`txt-${i}`} className="rich-text-segment">
            {renderInlineTokens(
              seg.value,
              { onSelectSubforum, onSelectAuthor },
              `seg-${i}`,
            )}
          </span>
        )
      })}
    </div>
  )
}
