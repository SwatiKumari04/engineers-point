export default function OrderCard({ order }) {
  const ready = order.status === "READY";

  return (
    <article className="order-card">
      <div className="order-header">
        <span>
          {order.orderNo}
          {order.source === "FLASH_SALE" && <span className="flash-badge"> FLASH</span>}
        </span>
        <span className={`status ${ready ? "ready-green" : ""}`}>
          {ready ? "READY TO PICK UP" : "Preparing..."}
        </span>
      </div>
      <p className="order-items">{order.items.map((i) => `${i.qty} x ${i.name}`).join(", ")}</p>
      <p className="order-total">Total: ₹{order.total}</p>
    </article>
  );
}
