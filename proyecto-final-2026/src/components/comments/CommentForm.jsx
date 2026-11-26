import { useState, useEffect, useRef } from 'react'
import ErrorAlert from '../ui/ErrorAlert'
import RichContentRenderer from '../ui/RichContentRenderer'
import { validateComment } from '../../utils/validators'
import {
  clearCommentDraft,
  getCommentDraft,
  getSavedAuthor,
  saveAuthor,
  saveCommentDraft,
} from '../../utils/storage'

const QUICK_EMOJIS = ['🚀', '🔥', '💡', '🦅', '💻', '✅']

export default function CommentForm({ onSubmit, replyToSignal, postId }) {
  const [author, setAuthor] = useState(getSavedAuthor())
  const [content, setContent] = useState(() => getCommentDraft(postId))
  const [previewMode, setPreviewMode] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    setContent(getCommentDraft(postId))
  }, [postId])

  useEffect(() => {
    saveCommentDraft(postId, content)
  }, [postId, content])

  useEffect(() => {
    const onAuthorChanged = (e) => setAuthor(e.detail || '')
    window.addEventListener('lcc-author-changed', onAuthorChanged)
    return () => window.removeEventListener('lcc-author-changed', onAuthorChanged)
  }, [])

  // Cuando el usuario pulsa "↩ Responder" en un comentario, inserta u/autor y enfoca
  useEffect(() => {
    if (replyToSignal?.author) {
      const mention = `u/${replyToSignal.author} `
      setPreviewMode(false)
      setContent((prev) =>
        prev.includes(mention)
          ? prev
          : `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${mention}`,
      )
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 40)
    }
  }, [replyToSignal])

  const appendSnippet = (snippet) => {
    setContent((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${snippet}`)
    textareaRef.current?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const validation = validateComment({ author, content })
    if (!validation.isValid) {
      setError({
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos de tu comentario.',
        details: validation.details,
      })
      return
    }

    try {
      setSubmitting(true)
      saveAuthor(author)
      await onSubmit({
        author: author.trim(),
        content: content.trim(),
      })
      clearCommentDraft(postId)
      setContent('')
      setPreviewMode(false)
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="comment-form-card">
      <div className="comment-form-header">
        <h4>Agregar un comentario</h4>
        <span className="immutable-badge">
          🔒 Los comentarios son permanentes (no se pueden editar ni eliminar)
        </span>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label" htmlFor="comment-author">
            Tu nombre o alias (<code>author</code>)
          </label>
          <span className="char-counter">{author.length} / 50</span>
        </div>
        <input
          id="comment-author"
          type="text"
          className="form-input"
          placeholder="Escribe un alias o autor..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={50}
          disabled={submitting}
          required
        />
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label" htmlFor="comment-content">
            Tu comentario (<code>content</code>)
          </label>
          <div className="editor-tabs-bar">
            <button
              type="button"
              className={`editor-tab-btn ${!previewMode ? 'active' : ''}`}
              onClick={() => setPreviewMode(false)}
            >
              ✍️ Escribir
            </button>
            <button
              type="button"
              className={`editor-tab-btn ${previewMode ? 'active' : ''}`}
              onClick={() => setPreviewMode(true)}
            >
              👁️ Vista Previa
            </button>
            <span className={`char-counter ${content.length > 1400 ? 'char-warn' : ''}`}>
              {content.length} / 1500
            </span>
          </div>
        </div>

        {!previewMode ? (
          <>
            <div className="composer-format-tools">
              <button
                type="button"
                className="format-tool-btn"
                onClick={() => appendSnippet('\n```js\n// Código aquí\n```\n')}
              >
                &lt;/&gt; Código
              </button>
              <button
                type="button"
                className="format-tool-btn"
                onClick={() => appendSnippet('u/')}
              >
                @u/Usuario
              </button>
              <button
                type="button"
                className="format-tool-btn"
                onClick={() => appendSnippet('r/')}
              >
                r/Subforo
              </button>
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className="format-tool-btn emoji-quick-btn"
                  onClick={() => appendSnippet(em)}
                  title={`Insertar ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              id="comment-content"
              className="form-textarea"
              rows={3}
              placeholder="Escribe tu respuesta o aporte para este post (soporta bloques ```código```, u/autor y r/subforo)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1500}
              disabled={submitting}
              required
            />
          </>
        ) : (
          <div className="live-preview-stage">
            <span className="live-preview-eyebrow">VISTA PREVIA DEL COMENTARIO</span>
            <div className="live-preview-body">
              {content.trim() ? (
                <RichContentRenderer content={content} />
              ) : (
                <span className="text-muted">
                  Escribe algo en tu comentario para previsualizarlo aquí...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="comment-form-footer">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Publicando...' : 'Publicar comentario'}
        </button>
      </div>
    </form>
  )
}
