import { useCountdown } from "../../hooks/useCountdown.js";

export default function FlashSaleCard({ sale, onGrab, claiming }) {
  const timeLeft = useCountdown(sale.endsAt);
  const soldOut = sale.stock === 0;
  const stockPct = (sale.stock / sale.initialStock) * 100;

  return (
    <article className={`flash-card ${soldOut ? "sold-out" : ""}`}>
      <div className="flash-image" style={{ backgroundImage: `url(${sale.image})` }} />
      <div className="flash-info">
        <span className="flash-tag">FLASH SALE · ends in {timeLeft}</span>
        <h3>{sale.itemName}</h3>
        <p className="flash-price">
          <s>₹{sale.originalPrice}</s> <strong>₹{sale.salePrice}</strong>
        </p>
        <div className="stock-bar">
          <div className="stock-fill" style={{ width: `${stockPct}%` }} />
        </div>
        <p className="stock-note">
          {soldOut ? "Out of stock" : `${sale.stock} of ${sale.initialStock} left`}
        </p>
      </div>
      <button className="grab-btn" disabled={soldOut || claiming} onClick={onGrab}>
        {soldOut ? "OUT OF STOCK" : claiming ? "..." : "Grab 1"}
      </button>
    </article>
  );
}
