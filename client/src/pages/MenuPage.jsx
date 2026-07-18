import { useState } from "react";
import { placeOrder } from "../api/orders.api.js";
import { useAuth } from "../context/auth-context.js";
import { useCart } from "../hooks/useCart.js";
import { useMenu } from "../hooks/useMenu.js";
import Modal from "../components/common/Modal.jsx";
import FlashSaleStrip from "../components/flash/FlashSaleStrip.jsx";
import CartBar from "../components/menu/CartBar.jsx";
import CategoryTabs from "../components/menu/CategoryTabs.jsx";
import CheckoutModal from "../components/menu/CheckoutModal.jsx";
import MenuGrid from "../components/menu/MenuGrid.jsx";

export default function MenuPage({ onOrderPlaced }) {
  const { user } = useAuth();
  const { menu, categories } = useMenu();
  const cart = useCart(menu);

  const [activeCategory, setActiveCategory] = useState("All");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placed, setPlaced] = useState(null); // { droppedItems } after success
  const [orderError, setOrderError] = useState("");

  const inCategory =
    activeCategory === "All" ? menu : menu.filter((item) => item.category === activeCategory);
  // Available items first; out-of-stock ones sink below them in the grid.
  const visibleItems = [...inCategory].sort((a, b) => Number(b.available) - Number(a.available));

  const handleConfirm = async () => {
    try {
      const { droppedItems } = await placeOrder({
        customer: { name: user.name, phone: user.phone, email: user.email },
        items: cart.toOrderItems(),
      });
      cart.clear();
      setCheckoutOpen(false);
      setPlaced({ droppedItems });
    } catch (err) {
      setCheckoutOpen(false);
      setOrderError(err.message);
    }
  };

  return (
    <main className="menu-view">
      <FlashSaleStrip />
      <CategoryTabs categories={categories} active={activeCategory} onSelect={setActiveCategory} />
      <MenuGrid items={visibleItems} getQty={cart.getQty} onChangeQty={cart.updateQty} />

      {cart.count > 0 && (
        <CartBar count={cart.count} total={cart.total} onCheckout={() => setCheckoutOpen(true)} />
      )}

      {checkoutOpen && (
        <CheckoutModal
          total={cart.total}
          onConfirm={handleConfirm}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {placed && (
        <Modal
          tone="success"
          title="Order placed"
          actions={
            <button className="btn btn-success btn-block" onClick={onOrderPlaced}>
              Track Order
            </button>
          }
        >
          <p>Your order has been sent to the kitchen.</p>
          {placed.droppedItems.length > 0 && (
            <p>Not included (out of stock): {placed.droppedItems.join(", ")}</p>
          )}
        </Modal>
      )}

      {orderError && (
        <Modal tone="error" title="Order not placed" onClose={() => setOrderError("")}>
          <p>{orderError}</p>
        </Modal>
      )}
    </main>
  );
}
