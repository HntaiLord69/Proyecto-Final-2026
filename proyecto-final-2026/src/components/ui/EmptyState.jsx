export default function EmptyState({ icon = '💬', title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
