import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import ErrorAlert from '../ui/ErrorAlert'
import ImageDropzone from '../ui/ImageDropzone'
import RichContentRenderer from '../ui/RichContentRenderer'
import { validatePost } from '../../utils/validators'
import {
  clearPostDraft,
  getPostDraft,
  getSavedAuthor,
  saveAuthor,
  savePostDraft,
} from '../../utils/storage'

const QUICK_EMOJIS = ['🚀', '🔥', '💡', '🦅', '💻', '✅']

/**
 * Formulario modal para:
 * - Crear un nuevo post (POST /subforums/:name/posts) con selector de comunidad y autoguardado de borrador.
 * - Editar parcialmente un post (PATCH /subforums/:name/posts/:postId)
 *   incluyendo zona Drag & Drop para arrastrar y soltar imágenes.
 */
export default function PostFormModal({
  isOpen,
  onClose,
  onSubmit,
  subforumName,
  subforums = [],
  initialPost = null,
}) {
  const isEdit = Boolean(initialPost)
  const [selectedSubforum, setSelectedSubforum] = useState(subforumName || '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialPost) {
        setSelectedSubforum(initialPost.subforum || subforumName || '')
        setTitle(initialPost.title || '')
        setContent(initialPost.content || '')
        setAuthor(initialPost.author || getSavedAuthor())
        setImageUrl(initialPost.imageUrl || '')
        setHasRestoredDraft(false)
      } else {
        const draft = getPostDraft()
        setSelectedSubforum(
          subforumName || draft?.subforum || subforums[0]?.name || 'pruebas',
        )
        setTitle(draft?.title || '')
        setContent(draft?.content || '')
        setAuthor(getSavedAuthor())
        setImageUrl(draft?.imageUrl || '')
        setHasRestoredDraft(
          Boolean(draft?.title?.trim() || draft?.content?.trim() || draft?.imageUrl?.trim()),
        )
      }
      setIsUploadingImage(false)
      setPreviewMode(false)
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen, initialPost, isEdit, subforumName, subforums])

  // Autoguardar borrador mientras el usuario escribe una nueva publicación
  useEffect(() => {
    if (!isOpen || isEdit) return
    savePostDraft({
      subforum: selectedSubforum,
      title,
      content,
      imageUrl,
    })
  }, [isOpen, isEdit, selectedSubforum, title, content, imageUrl])

  const appendToContent = (snippet) => {
    setContent((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${snippet}`)
  }

  const handleClearDraft = () => {
    clearPostDraft()
    setTitle('')
    setContent('')
    setImageUrl('')
    setHasRestoredDraft(false)
  }

  const effectiveSubforum = selectedSubforum || subforumName || subforums[0]?.name || 'pruebas'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isUploadingImage) return
    setError(null)

    const validation = validatePost(
      { title, content, author, imageUrl },
      isEdit,
    )

    if (!validation.isValid) {
      setError({
        code: 'VALIDATION_ERROR',
        message: 'Uno o más campos del post no son válidos.',
        details: validation.details,
      })
      return
    }

    try {
      setSubmitting(true)
      if (!isEdit) {
        saveAuthor(author)
      }

      if (isEdit) {
        const cleanTitle = title.trim()
        const cleanContent = content.trim()
        const cleanImage = imageUrl.trim() ? imageUrl.trim() : null

        const diff = {}
        if (cleanTitle !== initialPost.title) diff.title = cleanTitle
        if (cleanContent !== initialPost.content) diff.content = cleanContent
        if (cleanImage !== (initialPost.imageUrl || null)) diff.imageUrl = cleanImage

        if (Object.keys(diff).length === 0) {
          diff.title = cleanTitle
          diff.content = cleanContent
          diff.imageUrl = cleanImage
        }

        await onSubmit(diff, effectiveSubforum)
      } else {
        await onSubmit(
          {
            title: title.trim(),
            content: content.trim(),
            author: author.trim(),
            imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
          },
          effectiveSubforum,
        )
        clearPostDraft()
      }
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        isEdit
          ? `Editar Post #${initialPost.id}`
          : `Crear Publicación en r/${effectiveSubforum}`
      }
      subtitle={
        isEdit
          ? 'Puedes modificar el título, el contenido o arrastrar una nueva imagen.'
          : 'Elige la comunidad destino, escribe tu alias y redacta tu publicación. Tu progreso se guarda automáticamente como borrador.'
      }
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        {!isEdit && (hasRestoredDraft || title.trim() || content.trim()) && (
          <div className="draft-status-banner">
            <span>📝 Borrador autoguardado localmente</span>
            <button
              type="button"
              className="btn-link"
              onClick={handleClearDraft}
            >
              Limpiar borrador ✕
            </button>
          </div>
        )}

        {/* Selector de Comunidad Destino cuando hay subforos disponibles */}
        {!isEdit && subforums.length > 0 && (
          <div className="form-group">
            <label className="form-label" htmlFor="modal-target-subforum">
              Comunidad donde quieres publicar (<code>r/subforo</code>)
            </label>
            <select
              id="modal-target-subforum"
              className="select-input"
              value={effectiveSubforum}
              onChange={(e) => setSelectedSubforum(e.target.value)}
              disabled={submitting}
            >
              {subforums.map((s) => (
                <option key={s.name} value={s.name}>
                  r/{s.name} — {s.description?.slice(0, 60) || 'Comunidad activa'} ({s.postCount} posts)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="post-author">
              Tu nombre o alias (<code>author</code>)
            </label>
            <span className="char-counter">{author.length} / 50</span>
          </div>
          <input
            id="post-author"
            type="text"
            className="form-input"
            placeholder="Escribe un alias o autor..."
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={50}
            disabled={isEdit || submitting}
            required={!isEdit}
          />
          {isEdit && (
            <span className="form-hint">
              El campo <code>author</code> está protegido y no se modifica al editar.
            </span>
          )}
        </div>

        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="post-title">
              1° Título de la publicación (<code>title</code>)
            </label>
            <span className={`char-counter ${title.length > 135 ? 'char-warn' : ''}`}>
              {title.length} / 150
            </span>
          </div>
          <input
            id="post-title"
            type="text"
            className="form-input"
            placeholder="Escribe un título claro y descriptivo..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            disabled={submitting}
            required
          />
        </div>

        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="post-content">
              2° Contenido en texto (<code>content</code>)
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
              <span className={`char-counter ${content.length > 4800 ? 'char-warn' : ''}`}>
                {content.length} / 5000
              </span>
            </div>
          </div>

          {!previewMode ? (
            <>
              <div className="composer-format-tools">
                <button
                  type="button"
                  className="format-tool-btn"
                  onClick={() =>
                    appendToContent('\n```js\n// Código aquí\n```\n')
                  }
                >
                  &lt;/&gt; Código
                </button>
                <button
                  type="button"
                  className="format-tool-btn"
                  onClick={() => appendToContent('u/')}
                >
                  @u/Usuario
                </button>
                <button
                  type="button"
                  className="format-tool-btn"
                  onClick={() => appendToContent('r/')}
                >
                  r/Subforo
                </button>
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="format-tool-btn emoji-quick-btn"
                    onClick={() => appendToContent(em)}
                    title={`Insertar ${em}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <textarea
                id="post-content"
                className="form-textarea"
                rows={5}
                placeholder="Desarrolla aquí tu publicación (soporta bloques ```codigo```, menciones u/autor y r/subforo)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                disabled={submitting}
                required
              />
            </>
          ) : (
            <div className="live-preview-stage">
              <span className="live-preview-eyebrow">
                VISTA PREVIA EN VIVO (1° Título → 2° Contenido → 3° Imagen)
              </span>
              <h3 className="live-preview-title">
                {title.trim() || 'Título de tu publicación...'}
              </h3>
              <div className="live-preview-body">
                {content.trim() ? (
                  <RichContentRenderer content={content} />
                ) : (
                  <span className="text-muted">
                    Escribe contenido para previsualizar el formato...
                  </span>
                )}
              </div>
              {imageUrl.trim() && (
                <img
                  src={imageUrl.trim()}
                  alt="Vista previa adjunta"
                  className="image-preview-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* 3° Zona Drag & Drop de Imagen o Multimedia al final */}
        <div className="form-group">
          <label className="form-label">
            3° Imagen o Multimedia Opcional (Arrastra un archivo o pega URL)
          </label>
          <ImageDropzone
            imageUrl={imageUrl}
            onChangeUrl={setImageUrl}
            disabled={submitting}
            onUploadStateChange={setIsUploadingImage}
          />
        </div>

        <div className="modal-footer-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting || isUploadingImage}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || isUploadingImage}
          >
            {isUploadingImage
              ? 'Subiendo imagen...'
              : submitting
                ? 'Procesando...'
                : isEdit
                  ? 'Guardar cambios (PATCH)'
                  : `Publicar en r/${effectiveSubforum}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
