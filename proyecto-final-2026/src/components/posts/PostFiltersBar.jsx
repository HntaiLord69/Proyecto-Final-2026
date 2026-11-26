/**
 * Barra de filtros y ordenamiento conectada a todos los Query Params de
 * GET /subforums/:name/posts (Sección 5.1 y 8 de la especificación):
 * - sortBy: 'date' | 'author' | 'contentLength' | 'likes' | 'dislikes'
 * - order: 'desc' | 'asc'
 * - hasImage: '' | 'true' | 'false'
 * - afterDate: 'YYYY-MM-DD'
 * - beforeDate: 'YYYY-MM-DD'
 * - limit: 5 | 10 | 20 | 50
 */
export default function PostFiltersBar({
  filters,
  onChangeFilters,
  onResetFilters,
}) {
  const hasActiveFilters =
    filters.hasImage !== '' ||
    Boolean(filters.afterDate) ||
    Boolean(filters.beforeDate) ||
    filters.sortBy !== 'date' ||
    filters.order !== 'desc'

  const updateField = (key, value) => {
    onChangeFilters({
      ...filters,
      [key]: value,
      page: 1, // Al cambiar un filtro regresamos a la página 1
    })
  }

  return (
    <div className="filters-panel">
      <div className="filters-row-top">
        {/* Chips rápidos para hasImage */}
        <div className="filter-chips" role="group" aria-label="Filtrar por imagen">
          <button
            type="button"
            className={`filter-chip ${filters.hasImage === '' ? 'active' : ''}`}
            onClick={() => updateField('hasImage', '')}
          >
            Todos los posts
          </button>
          <button
            type="button"
            className={`filter-chip ${filters.hasImage === 'true' ? 'active' : ''}`}
            onClick={() => updateField('hasImage', 'true')}
          >
            🖼️ Solo con imagen
          </button>
          <button
            type="button"
            className={`filter-chip ${filters.hasImage === 'false' ? 'active' : ''}`}
            onClick={() => updateField('hasImage', 'false')}
          >
            📄 Solo texto
          </button>
        </div>

        {/* Controles de ordenamiento (sortBy y order) */}
        <div className="filter-sort-group">
          <label className="filter-inline-label" htmlFor="post-sort-by">
            Ordenar por:
          </label>
          <select
            id="post-sort-by"
            className="select-input select-sm"
            value={filters.sortBy}
            onChange={(e) => updateField('sortBy', e.target.value)}
          >
            <option value="date">Fecha de creación</option>
            <option value="likes">Más likes</option>
            <option value="dislikes">Más dislikes</option>
            <option value="author">Autor (A–Z)</option>
            <option value="contentLength">Longitud de texto</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() =>
              updateField('order', filters.order === 'desc' ? 'asc' : 'desc')
            }
            title="Cambiar dirección de ordenamiento (desc / asc)"
          >
            {filters.order === 'desc' ? '↓ Descendente' : '↑ Ascendente'}
          </button>
        </div>
      </div>

      <div className="filters-row-bottom">
        <div className="filter-dates-group">
          <div className="filter-date-item">
            <label htmlFor="after-date" className="filter-inline-label">
              Desde:
            </label>
            <input
              id="after-date"
              type="date"
              className="form-input input-sm"
              value={filters.afterDate}
              max={filters.beforeDate || undefined}
              onChange={(e) => updateField('afterDate', e.target.value)}
            />
          </div>

          <div className="filter-date-item">
            <label htmlFor="before-date" className="filter-inline-label">
              Hasta:
            </label>
            <input
              id="before-date"
              type="date"
              className="form-input input-sm"
              value={filters.beforeDate}
              min={filters.afterDate || undefined}
              onChange={(e) => updateField('beforeDate', e.target.value)}
            />
          </div>

          <div className="filter-date-item">
            <label htmlFor="limit-select" className="filter-inline-label">
              Mostrar:
            </label>
            <select
              id="limit-select"
              className="select-input select-sm"
              value={filters.limit}
              onChange={(e) => updateField('limit', Number(e.target.value))}
            >
              <option value={5}>5 por pág.</option>
              <option value={10}>10 por pág.</option>
              <option value={20}>20 por pág.</option>
              <option value={50}>50 por pág.</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onResetFilters}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
