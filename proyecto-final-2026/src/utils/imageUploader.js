/**
 * Servicio de subida automática de archivos multimedia arrastrados (Drag & Drop).
 * Incluye optimización/compresión automática en el navegador (<canvas>) para fotos
 * pesadas de celular y convierte cualquier imagen local (PNG, JPG, WEBP, GIF, SVG)
 * en una URL pública `https://...` compatible 100% con el campo `imageUrl` de la API LCC-chan.
 */

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB

export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo.' }
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Formato no soportado. Arrastra una imagen (PNG, JPG, WEBP, GIF o SVG).',
    }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'La imagen supera el límite de 15 MB.',
    }
  }
  return { valid: true }
}

/**
 * Optimiza imágenes grandes (por ejemplo fotos tomadas desde la cámara de un celular)
 * redimensionando a un máximo de 1800px y comprimiendo a JPEG/WebP de alta calidad
 * para que suban en menos de 1 segundo incluso con datos móviles.
 */
async function optimizeImageIfNeeded(file) {
  // No tocar GIFs animados ni SVGs ni archivos ya ligeros (< 550 KB)
  if (
    !file ||
    file.type === 'image/gif' ||
    file.type === 'image/svg+xml' ||
    file.size < 550 * 1024
  ) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX_DIM = 1800
      let { width, height } = img

      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      const outType = file.type === 'image/png' ? 'image/webp' : 'image/jpeg'
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file)
            return
          }
          const ext = outType === 'image/webp' ? 'webp' : 'jpg'
          const baseName = (file.name || 'imagen').replace(/\.[^.]+$/, '')
          const optimizedFile = new File([blob], `${baseName}.${ext}`, {
            type: outType,
          })
          resolve(optimizedFile)
        },
        outType,
        0.85,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

/**
 * Sube un archivo local y devuelve la URL pública `https://...` resultante.
 */
export async function uploadImageFileToCloud(rawFile) {
  const check = validateImageFile(rawFile)
  if (!check.valid) {
    throw new Error(check.error)
  }

  const file = await optimizeImageIfNeeded(rawFile)

  // 1. Intentar subida permanente vía proxy (/api-catbox-upload en Vite y en vercel.json)
  try {
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', file, file.name)

    const response = await fetch('/api-catbox-upload', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const textUrl = (await response.text()).trim()
      if (/^https?:\/\//i.test(textUrl)) {
        return textUrl
      }
    }
  } catch {
    // Continuar con el endpoint directo con CORS habilitado
  }

  // 2. Fallback directo con CORS abierto (Access-Control-Allow-Origin: *)
  const fallbackForm = new FormData()
  fallbackForm.append('reqtype', 'fileupload')
  fallbackForm.append('time', '72h')
  fallbackForm.append('fileToUpload', file, file.name)

  const fallbackRes = await fetch(
    'https://litterbox.catbox.moe/resources/internals/api.php',
    {
      method: 'POST',
      body: fallbackForm,
    },
  )

  if (!fallbackRes.ok) {
    throw new Error('No se pudo subir la imagen al servidor multimedia.')
  }

  const finalUrl = (await fallbackRes.text()).trim()
  if (!/^https?:\/\//i.test(finalUrl)) {
    throw new Error('Respuesta inesperada del servidor multimedia.')
  }

  return finalUrl
}
