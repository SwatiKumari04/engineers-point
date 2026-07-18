import { useState } from "react";
import { endSale, launchSale } from "../../api/flashSales.api.js";
import { useAuth } from "../../context/auth-context.js";
import { useFlashSales } from "../../hooks/useFlashSales.js";
import { useMenu } from "../../hooks/useMenu.js";
import Modal from "../common/Modal.jsx";

export default function FlashSalePanel() {
  const { user } = useAuth();
  const { menu } = useMenu();
  const { sales, refresh } = useFlashSales();
  const [error, setError] = useState("");

  const handleLaunch = async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      await launchSale(
        {
          itemId: form.get("itemId"),
          salePrice: Number(form.get("salePrice")),
          stock: Number(form.get("stock")),
          durationMinutes: Number(form.get("durationMinutes")),
        },
        user.adminId,
      );
      event.target.reset();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEnd = async (saleId) => {
    await endSale(saleId, user.adminId);
    await refresh();
  };

  return (
    <section className="flash-panel">
      <h3>Flash Sales</h3>
      <form className="flash-form" onSubmit={handleLaunch}>
        <select name="itemId" required defaultValue="">
          <option value="" disabled>Pick an item</option>
          {menu.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} (₹{item.price})
            </option>
          ))}
        </select>
        <input name="salePrice" type="number" min="1" placeholder="Sale price ₹" required />
        <input name="stock" type="number" min="1" max="500" placeholder="Stock" required />
        <input name="durationMinutes" type="number" min="1" max="180" placeholder="Minutes" required />
        <button type="submit" className="btn btn-success">Launch</button>
      </form>

      {sales.map((sale) => (
        <div key={sale.id} className="flash-row">
          <span>
            <strong>{sale.itemName}</strong> · ₹{sale.salePrice} · {sale.stock}/{sale.initialStock} left
            {sale.status === "SOLD_OUT" && " · SOLD OUT"}
          </span>
          <button className="btn btn-danger" onClick={() => handleEnd(sale.id)}>End</button>
        </div>
      ))}

      {error && (
        <Modal tone="error" title="Couldn't launch sale" onClose={() => setError("")}>
          <p>{error}</p>
        </Modal>
      )}
    </section>
  );
}
