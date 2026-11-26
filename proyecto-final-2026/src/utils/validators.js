/**
 * Validadores estrictos basados en la especificación oficial de LCC-chan API.
 */

const SUBFORUM_NAME_REGEX = /^[a-z0-9-]{3,40}$/

/**
 * Normaliza un texto para convertirlo en un identificador válido de subforo (slug).
 */
export function normalizeSubforumName(rawValue = '') {
  return rawValue
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)
}

/**
 * Valida la creación de un subforo (POST /subforums)
 */
export function validateSubforum({ name, description }) {
  const details = []
  const trimmedName = (name || '').trim()
  const trimmedDesc = (description || '').trim()

  if (!trimmedName) {
    details.push({
      field: 'name',
      issue: 'El nombre del subforo es obligatorio.',
    })
  } else if (!SUBFORUM_NAME_REGEX.test(trimmedName)) {
    details.push({
      field: 'name',
      issue:
        'Debe tener entre 3 y 40 caracteres y usar solo letras minúsculas (a-z), números (0-9) y guiones (-), sin espacios.',
    })
  }

  if (!trimmedDesc) {
    details.push({
      field: 'description',
      issue: 'La descripción del subforo es obligatoria.',
    })
  } else if (trimmedDesc.length > 300) {
    details.push({
      field: 'description',
      issue: 'La descripción no puede exceder los 300 caracteres.',
    })
  }

  return {
    isValid: details.length === 0,
    details,
  }
}

/**
 * Valida la edición de descripción de un subforo (PATCH /subforums/:name)
 */
export function validateSubforumDescription(description) {
  const trimmedDesc = (description || '').trim()
  const details = []

  if (!trimmedDesc) {
    details.push({
      field: 'description',
      issue: 'La descripción no puede estar vacía (1 a 300 caracteres).',
    })
  } else if (trimmedDesc.length > 300) {
    details.push({
      field: 'description',
      issue: 'La descripción no puede exceder los 300 caracteres.',
    })
  }

  return {
    isValid: details.length === 0,
    details,
  }
}

/**
 * Verifica si una cadena es una URL externa válida con http:// o https://
 */
export function isValidHttpUrl(value) {
  if (!value) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Valida los datos de un post (POST o PATCH /subforums/:name/posts)
 */
export function validatePost({ title, content, author, imageUrl }, isEdit = false) {
  const details = []
  const trimmedTitle = (title || '').trim()
  const trimmedContent = (content || '').trim()
  const trimmedAuthor = (author || '').trim()
  const trimmedImage = (imageUrl || '').trim()

  if (!trimmedTitle) {
    details.push({
      field: 'title',
      issue: 'El título es obligatorio (1 a 150 caracteres).',
    })
  } else if (trimmedTitle.length > 150) {
    details.push({
      field: 'title',
      issue: 'El título no puede superar los 150 caracteres.',
    })
  }

  if (!trimmedContent) {
    details.push({
      field: 'content',
      issue: 'El contenido es obligatorio (1 a 5000 caracteres).',
    })
  } else if (trimmedContent.length > 5000) {
    details.push({
      field: 'content',
      issue: 'El contenido no puede superar los 5000 caracteres.',
    })
  }

  if (!isEdit) {
    if (!trimmedAuthor) {
      details.push({
        field: 'author',
        issue: 'El nombre del autor es obligatorio (1 a 50 caracteres).',
      })
    } else if (trimmedAuthor.length > 50) {
      details.push({
        field: 'author',
        issue: 'El nombre del autor no puede superar los 50 caracteres.',
      })
    }
  }

  if (trimmedImage && !isValidHttpUrl(trimmedImage)) {
    details.push({
      field: 'imageUrl',
      issue: 'La URL de la imagen debe iniciar con http:// o https://.',
    })
  }

  return {
    isValid: details.length === 0,
    details,
  }
}

/**
 * Valida la creación de un comentario (POST /subforums/:name/posts/:postId/comments)
 */
export function validateComment({ author, content }) {
  const details = []
  const trimmedAuthor = (author || '').trim()
  const trimmedContent = (content || '').trim()

  if (!trimmedAuthor) {
    details.push({
      field: 'author',
      issue: 'El nombre del autor es obligatorio (1 a 50 caracteres).',
    })
  } else if (trimmedAuthor.length > 50) {
    details.push({
      field: 'author',
      issue: 'El autor no puede exceder los 50 caracteres.',
    })
  }

  if (!trimmedContent) {
    details.push({
      field: 'content',
      issue: 'El comentario no puede estar vacío (1 a 1500 caracteres).',
    })
  } else if (trimmedContent.length > 1500) {
    details.push({
      field: 'content',
      issue: 'El comentario no puede exceder los 1500 caracteres.',
    })
  }

  return {
    isValid: details.length === 0,
    details,
  }
}
