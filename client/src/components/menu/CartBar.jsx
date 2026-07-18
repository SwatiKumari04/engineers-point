export default function CartBar({ count, total, onCheckout }) {
  return (
    <div className="cart-bar">
      <div className="cart-info">
        <span>{count} {count === 1 ? "Item" : "Items"}</span>
        <span className="total-price">₹{total}</span>
      </div>
      <button className="btn btn-success" onClick={onCheckout}>Proceed</button>
    </div>
  );
}
