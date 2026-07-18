export default function OwnerOrderCard({ order, onReady }) {
  return (
    <div className={`owner-card ${order.status === "READY" ? "is-ready" : ""}`}>
      <div className="card-top">
        <h3>
          {order.customer.name} <small>({order.customer.email})</small>
          {order.source === "FLASH_SALE" && <span className="flash-badge"> FLASH</span>}
        </h3>
        <span className="status-badge">{order.status}</span>
      </div>
      <p>{order.customer.phone} · {order.orderNo}</p>
      <p className="items-list">{order.items.map((i) => `${i.qty} x ${i.name}`).join(", ")}</p>
      <p className="total">Total: ₹{order.total}</p>
      {order.status === "PREPARING" && (
        <button className="btn btn-success btn-block" onClick={onReady}>
          Mark as Ready
        </button>
      )}
    </div>
  );
}
