const TONE_CLASS = { info: "", success: "modal-success", error: "modal-error" };

export default function Modal({ title, tone = "info", onClose, children, actions }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {title && <h3 className={`modal-title ${TONE_CLASS[tone]}`}>{title}</h3>}
        {children}
        {actions ?? (
          <button className="btn btn-danger btn-block" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
