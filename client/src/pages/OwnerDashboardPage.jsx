import { useAuth } from "../context/auth-context.js";
import { useAllOrders } from "../hooks/useAllOrders.js";
import FlashSalePanel from "../components/owner/FlashSalePanel.jsx";
import MenuPanel from "../components/owner/MenuPanel.jsx";
import OwnerOrderCard from "../components/owner/OwnerOrderCard.jsx";

export default function OwnerDashboardPage() {
  const { user, logout } = useAuth();
  const { orders, markReady } = useAllOrders(user.adminId);

  return (
    <div className="owner-dashboard">
      <header className="owner-header">
        <h2>Owner Dashboard</h2>
        <button className="btn-ghost" onClick={logout}>Logout</button>
      </header>

      <FlashSalePanel />
      <MenuPanel />

      <section className="orders-list">
        <h3>Live Orders</h3>
        {orders.length === 0 && <p className="empty-note">No orders yet tonight.</p>}
        {orders.map((order) => (
          <OwnerOrderCard key={order.id} order={order} onReady={() => markReady(order.id)} />
        ))}
      </section>
    </div>
  );
}
