import { useState, useEffect } from 'react'
import ErrorAlert from '../ui/ErrorAlert'
import ImageDropzone from '../ui/ImageDropzone'
import { IconImage, IconPlus, IconSparkles } from '../ui/ForumIcons'
import { validatePost } from '../../utils/validators'
import { getSavedAuthor, saveAuthor } from '../../utils/storage'
import { uploadImageFileToCloud } from '../../utils/imageUploader'

/**
 * Compositor rápido e interactivo integrado directamente en el muro (estilo Reddit / X),
 * con soporte para arrastrar y soltar imágenes (Drag & Drop) directamente sobre la barra.
 */
export default function QuickPostComposer({
  subforumName,
  subforums = [],
  onPublish,
  onOpenFullModal,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSubforum, setSelectedSubforum] = useState(
    subforumName || subforums[0]?.name || '',
  )
  const [author, setAuthor] = useState(getSavedAuthor())
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showImageField, setShowImageField] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [collapsedDragOver, setCollapsedDragOver] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onAuthorChanged = (e) => {
      if (e.detail) setAuthor(e.detail)
    }
    window.addEventListener('lcc-author-changed', onAuthorChanged)
    return () => window.removeEventListener('lcc-author-changed', onAuthorChanged)
  }, [])

  const targetSubforum = subforumName || selectedSubforum || subforums[0]?.name || ''

  const insertSnippet = (snippet) => {
    setContent((prev) => (prev ? `${prev}\n${snippet}` : snippet))
  }

  // Si arrastran un archivo sobre la barra minimizada, se expande y sube la imagen automáticamente
  const handleCollapsedDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCollapsedDragOver(false)
    setIsExpanded(true)
    setShowImageField(true)

    const file = e.dataTransfer?.files?.[0]
    if (file) {
      try {
        setIsUploadingImage(true)
        const uploadedUrl = await uploadImageFileToCloud(file)
        setImageUrl(uploadedUrl)
      } catch (err) {
        setError({
          code: 'UPLOAD_ERROR',
          message: err.message || 'No se pudo subir la imagen arrastrada.',
        })
      } finally {
        setIsUploadingImage(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isUploadingImage) return
    setError(null)

    if (!targetSubforum) {
      setError({
        code: 'SUBFORUM_REQUIRED',
        message: 'Selecciona primero un subforo donde publicar.',
      })
      return
    }

    const validation = validatePost({ title, content, author, imageUrl }, false)
    if (!validation.isValid) {
      setError({
        code: 'VALIDATION_ERROR',
        message: 'Por favor corrige los siguientes campos antes de publicar:',
        details: validation.details,
      })
      return
    }

    try {
      setSubmitting(true)
      saveAuthor(author)
      await onPublish(targetSubforum, {
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      })
      setTitle('')
      setContent('')
      setImageUrl('')
      setShowImageField(false)
      setIsExpanded(false)
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`quick-composer-card ${isExpanded ? 'expanded' : ''} ${
        collapsedDragOver ? 'composer-drag-active' : ''
      }`}
    >
      {!isExpanded ? (
        <div
          className="quick-composer-collapsed"
          onDragOver={(e) => {
            e.preventDefault()
            setCollapsedDragOver(true)
          }}
          onDragLeave={() => setCollapsedDragOver(false)}
          onDrop={handleCollapsedDrop}
        >
          <div className="composer-avatar">
            {(author || 'U').charAt(0).toUpperCase()}
          </div>
          <button
            type="button"
            className="composer-fake-input"
            onClick={() => setIsExpanded(true)}
          >
            {collapsedDragOver
              ? '📂 ¡Suelta la imagen aquí para adjuntarla a tu publicación!'
              : subforumName
                ? `Crear publicación o arrastrar imagen en r/${subforumName}...`
                : '¿Qué quieres publicar hoy? Haz clic o arrastra una imagen aquí...'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setIsExpanded(true)
              setShowImageField(true)
            }}
            title="Subir imagen arrastrando archivo o pegando URL"
          >
            <IconImage size={16} />
            <span>Subir Imagen</span>
          </button>
          {onOpenFullModal && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenFullModal}
              title="Abrir editor en ventana modal"
            >
              <IconPlus size={16} />
              <span>Publicar</span>
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="quick-composer-form">
          <div className="composer-header">
            <div className="composer-header-title">
              <IconSparkles size={18} />
              <span>
                Nueva publicación{' '}
                {subforumName ? (
                  <strong>en r/{subforumName}</strong>
                ) : (
                  'rápida en el foro'
                )}
              </span>
            </div>
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsExpanded(false)
                setError(null)
              }}
            >
              Minimizar ✕
            </button>
          </div>

          <ErrorAlert error={error} onDismiss={() => setError(null)} />

          <div className="composer-top-grid">
            {!subforumName && subforums.length > 0 && (
              <div className="form-group">
                <label className="form-label" htmlFor="quick-subforum">
                  Comunidad destino
                </label>
                <select
                  id="quick-subforum"
                  className="select-input"
                  value={targetSubforum}
                  onChange={(e) => setSelectedSubforum(e.target.value)}
                >
                  {subforums.map((s) => (
                    <option key={s.name} value={s.name}>
                      r/{s.name} ({s.postCount} posts)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="quick-author">
                  Tu alias de autor (<code>author</code>)
                </label>
                <span className="char-counter">{author.length}/50</span>
              </div>
              <input
                id="quick-author"
                type="text"
                className="form-input"
                placeholder="Escribe un alias o autor..."
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={50}
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="quick-title">
                  1° Título del Post (<code>title</code>)
                </label>
                <span className="char-counter">{title.length}/150</span>
              </div>
              <input
                id="quick-title"
                type="text"
                className="form-input"
                placeholder="Un título atractivo para tu publicación..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="quick-content">
                2° Contenido en texto (<code>content</code>)
              </label>
              <div className="composer-format-tools">
                <button
                  type="button"
                  className="format-tool-btn"
                  onClick={() =>
                    insertSnippet('```js\n// Tu código aquí\nconsole.log("Hola LCC-chan");\n```')
                  }
                  title="Insertar bloque de código con botón de copiado"
                >
                  {'</>'} Bloque de código
                </button>
                <button
                  type="button"
                  className="format-tool-btn"
                  onClick={() => insertSnippet(`r/${targetSubforum || 'pruebas'} `)}
                  title="Mencionar subforo clicable"
                >
                  + r/subforo
                </button>
                <span className="char-counter">{content.length}/5000</span>
              </div>
            </div>
            <textarea
              id="quick-content"
              className="form-textarea"
              rows={4}
              placeholder="Comparte tu pregunta, código (usa ``` para bloques de código), enlaces o menciones r/subforo y u/usuario..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              required
            />
          </div>

          {showImageField && (
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">
                  3° Imagen o Multimedia (Arrastra un archivo o pega URL)
                </label>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setImageUrl('')
                    setShowImageField(false)
                  }}
                >
                  Ocultar zona multimedia
                </button>
              </div>
              <ImageDropzone
                imageUrl={imageUrl}
                onChangeUrl={setImageUrl}
                disabled={submitting}
                onUploadStateChange={setIsUploadingImage}
              />
            </div>
          )}

          <div className="composer-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowImageField((prev) => !prev)}
            >
              <IconImage size={16} />
              <span>
                {showImageField
                  ? 'Zona multimedia activa'
                  : '📂 Arrastrar o subir imagen'}
              </span>
            </button>

            <div className="composer-footer-right">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsExpanded(false)}
                disabled={submitting || isUploadingImage}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submitting || isUploadingImage}
              >
                {isUploadingImage
                  ? 'Subiendo imagen...'
                  : submitting
                    ? 'Publicando...'
                    : `Publicar en r/${targetSubforum}`}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
