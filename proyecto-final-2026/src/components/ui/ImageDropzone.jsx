import { useState, useRef } from 'react'
import { IconImage } from './ForumIcons'
import { uploadImageFileToCloud } from '../../utils/imageUploader'

/**
 * Zona interactiva Drag & Drop + Selector de Archivos + Pegado desde Portapapeles + URL Externa.
 * Sube automáticamente el archivo arrastrado y entrega una URL `https://...` lista para `imageUrl`.
 */
export default function ImageDropzone({
  imageUrl = '',
  onChangeUrl,
  disabled = false,
  onUploadStateChange,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [previewBroken, setPreviewBroken] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef(null)

  const setUploadingStatus = (state) => {
    setUploading(state)
    if (onUploadStateChange) onUploadStateChange(state)
  }

  const processFile = async (file) => {
    if (!file || disabled || uploading) return
    setUploadError(null)
    setPreviewBroken(false)
    setUploadedFileName(file.name)

    try {
      setUploadingStatus(true)
      const publicUrl = await uploadImageFileToCloud(file)
      onChangeUrl(publicUrl)
    } catch (err) {
      setUploadError(err.message || 'Error al subir la imagen.')
    } finally {
      setUploadingStatus(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !uploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled || uploading) return

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      processFile(files[0])
      return
    }

    // Si arrastraron una imagen o URL desde otra pestaña del navegador
    const droppedUrl =
      e.dataTransfer?.getData('text/uri-list') ||
      e.dataTransfer?.getData('text/plain')
    if (droppedUrl && /^https?:\/\//i.test(droppedUrl.trim())) {
      setUploadError(null)
      setPreviewBroken(false)
      onChangeUrl(droppedUrl.trim())
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    e.target.value = ''
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) processFile(file)
        break
      }
    }
  }

  return (
    <div className="dropzone-wrapper" onPaste={handlePaste}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />

      {/* Área de Arrastrar y Soltar (Drag & Drop) */}
      <div
        className={`glass-dropzone ${isDragging ? 'dropzone-dragging' : ''} ${
          uploading ? 'dropzone-uploading' : ''
        } ${imageUrl ? 'dropzone-has-media' : ''}`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        {uploading ? (
          <div className="dropzone-status-box">
            <div className="dropzone-spinner" />
            <div className="dropzone-status-text">
              <strong>Subiendo multimedia ({uploadedFileName || 'imagen'})...</strong>
              <span>Generando enlace público compatible con la API LCC-chan</span>
            </div>
            <div className="dropzone-progress-bar">
              <div className="dropzone-progress-shimmer" />
            </div>
          </div>
        ) : (
          <div className="dropzone-prompt">
            <div className="dropzone-icon-orb">
              <IconImage size={24} />
            </div>
            <div className="dropzone-prompt-text">
              <strong>
                {isDragging
                  ? '¡Suelta tu imagen aquí para subirla!'
                  : 'Arrastra y suelta una imagen aquí, o haz clic para elegir un archivo'}
              </strong>
              <span>
                Soporta PNG, JPG, WEBP, GIF y SVG (también puedes pegar una imagen con{' '}
                <kbd>Ctrl+V</kbd>)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Campo de URL externa sincronizado automáticamente */}
      <div className="dropzone-url-row">
        <input
          type="url"
          className="form-input"
          placeholder="O pega directamente una URL https://ejemplo.com/imagen.png"
          value={imageUrl}
          onChange={(e) => {
            setUploadError(null)
            setPreviewBroken(false)
            onChangeUrl(e.target.value)
          }}
          disabled={disabled || uploading}
        />
        {imageUrl && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onChangeUrl('')
              setUploadedFileName('')
              setPreviewBroken(false)
              setUploadError(null)
            }}
            disabled={disabled || uploading}
          >
            ✕ Quitar
          </button>
        )}
      </div>

      {uploadError && (
        <div className="dropzone-error-msg">⚠ {uploadError}</div>
      )}

      {/* Previsualización en Vivo con Escenario Desenfocado */}
      {imageUrl && imageUrl.trim() && !uploading && (
        <div className="dropzone-preview-stage animate-stagger">
          <div className="dropzone-preview-header">
            <span className="dropzone-ready-badge">
              ✓ Multimedia lista (se mostrará al final del post)
            </span>
            <code className="dropzone-url-code">{imageUrl.trim()}</code>
          </div>

          {!previewBroken ? (
            <div className="reddit-media-stage" style={{ minHeight: 180, maxHeight: 280 }}>
              <img
                src={imageUrl.trim()}
                alt=""
                aria-hidden="true"
                className="reddit-media-backdrop"
              />
              <img
                src={imageUrl.trim()}
                alt="Vista previa"
                className="reddit-media-foreground"
                style={{ maxHeight: 280 }}
                onError={() => setPreviewBroken(true)}
              />
            </div>
          ) : (
            <div className="post-image-fallback">
              ⚠ No se pudo previsualizar la imagen desde esa URL. Verifica que sea un enlace
              directo válido.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
