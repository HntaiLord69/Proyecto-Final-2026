import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import ErrorAlert from '../ui/ErrorAlert'
import {
  normalizeSubforumName,
  validateSubforum,
  validateSubforumDescription,
} from '../../utils/validators'

/**
 * Modal dual para:
 * - Crear un subforo nuevo (POST /subforums)
 * - Editar únicamente la descripción de un subforo existente (PATCH /subforums/:name)
 */
export default function SubforumFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialSubforum = null,
}) {
  const isEdit = Boolean(initialSubforum)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(initialSubforum?.name || '')
      setDescription(initialSubforum?.description || '')
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen, initialSubforum])

  const handleNameChange = (e) => {
    setName(normalizeSubforumName(e.target.value))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const validation = isEdit
      ? validateSubforumDescription(description)
      : validateSubforum({ name, description })

    if (!validation.isValid) {
      setError({
        code: 'VALIDATION_ERROR',
        message: 'Revisa los campos del formulario.',
        details: validation.details,
      })
      return
    }

    try {
      setSubmitting(true)
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
      })
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
      title={isEdit ? `Editar descripción de r/${initialSubforum.name}` : 'Crear nuevo Subforo'}
      subtitle={
        isEdit
          ? 'El nombre del subforo es permanente; solo puedes actualizar su descripción.'
          : 'Cualquier persona puede abrir una comunidad temática en LCC-chan.'
      }
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="subforum-name">
              Identificador del Subforo (<code>name</code>)
            </label>
            <span className="char-counter">{name.length} / 40</span>
          </div>
          <div className="input-prefix-group">
            <span className="input-prefix">r/</span>
            <input
              id="subforum-name"
              type="text"
              className="form-input"
              placeholder="programacion-web"
              value={name}
              onChange={handleNameChange}
              disabled={isEdit || submitting}
              maxLength={40}
              required
            />
          </div>
          <span className="form-hint">
            Solo letras minúsculas (<code>a-z</code>), números (<code>0-9</code>) y guiones (
            <code>-</code>), de 3 a 40 caracteres, sin espacios.
          </span>
        </div>

        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="subforum-description">
              Descripción del tema (<code>description</code>)
            </label>
            <span className={`char-counter ${description.length > 280 ? 'char-warn' : ''}`}>
              {description.length} / 300
            </span>
          </div>
          <textarea
            id="subforum-description"
            className="form-textarea"
            rows={4}
            placeholder="Describe de qué trata este subforo y qué tipo de publicaciones se comparten..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            disabled={submitting}
            required
          />
        </div>

        <div className="modal-footer-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? 'Guardando...'
              : isEdit
                ? 'Actualizar descripción'
                : 'Crear Subforo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
