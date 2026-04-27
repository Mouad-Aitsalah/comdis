function Modal({
  isOpen,
  eyebrow,
  title,
  description,
  onClose,
  children,
  actions,
  cardClassName = "",
  headerClassName = "",
  bodyClassName = "",
  actionsClassName = "",
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className={`modal-card ${cardClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {(eyebrow || title || description) ? (
          <div className={`modal-header ${headerClassName}`.trim()}>
            {eyebrow ? <p className="modal-eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="modal-title">{title}</h2> : null}
            {description ? <p className="modal-description">{description}</p> : null}
          </div>
        ) : null}

        <div className={`modal-body ${bodyClassName}`.trim()}>{children}</div>

        {actions ? (
          <div className={`modal-actions ${actionsClassName}`.trim()}>{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
