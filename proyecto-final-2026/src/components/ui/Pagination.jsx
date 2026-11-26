/**
 * Componente de paginación conectado al objeto `pagination` estándar de la API:
 * { page, limit, total, totalPages, hasNext, hasPrev }
 */
export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total === 0) return null

  const { page, totalPages, total, hasPrev, hasNext } = pagination

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Mostrando página <strong>{page}</strong> de <strong>{totalPages}</strong>{' '}
        <span className="text-muted">({total} resultados en total)</span>
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!hasPrev}
          onClick={() => hasPrev && onPageChange(page - 1)}
        >
          ← Anterior
        </button>
        <span className="pagination-badge">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!hasNext}
          onClick={() => hasNext && onPageChange(page + 1)}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
