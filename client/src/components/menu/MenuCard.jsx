export default function MenuCard({ item, qty, onChangeQty }) {
  return (
    <div className={`card${item.available ? "" : " unavailable"}`}>
      <div className="card-image" style={{ backgroundImage: `url(${item.image})` }} />
      <h3>{item.name}</h3>
      <p>₹{item.price}</p>
      <div className="qty-controls">
        {!item.available ? (
          <span className="oos-label">Out of stock</span>
        ) : qty > 0 ? (
          <>
            <button className="qty-btn minus" onClick={() => onChangeQty(item.id, -1)}>−</button>
            <span>{qty}</span>
            <button className="qty-btn plus" onClick={() => onChangeQty(item.id, 1)}>+</button>
          </>
        ) : (
          <button className="add-btn" onClick={() => onChangeQty(item.id, 1)}>ADD</button>
        )}
      </div>
    </div>
  );
}
