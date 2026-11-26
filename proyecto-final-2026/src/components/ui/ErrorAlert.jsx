/**
 * Muestra la estructura estándar de error que devuelve el servidor:
 * { code, message, details: [{ field, issue }] }
 */
export default function ErrorAlert({ error, onDismiss }) {
  if (!error) return null

  const message = typeof error === 'string' ? error : error.message
  const code = error.code || null
  const details = Array.isArray(error.details) ? error.details : []

  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-header">
        <div className="error-alert-title">
          <span className="error-icon">⚠</span>
          <strong>{message}</strong>
          {code && <span className="error-code">{code}</span>}
        </div>
        {onDismiss && (
          <button
            type="button"
            className="btn-icon btn-icon-sm"
            onClick={onDismiss}
            aria-label="Ocultar alerta"
          >
            ✕
          </button>
        )}
      </div>
      {details.length > 0 && (
        <ul className="error-details-list">
          {details.map((item, idx) => (
            <li key={`${item.field || idx}-${idx}`}>
              {item.field && <code>{item.field}</code>}: {item.issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
