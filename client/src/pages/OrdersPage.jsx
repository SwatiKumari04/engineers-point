import { useAuth } from "../context/auth-context.js";
import { useMyOrders } from "../hooks/useMyOrders.js";
import OrderCard from "../components/orders/OrderCard.jsx";

export default function OrdersPage() {
  const { user } = useAuth();
  const orders = useMyOrders(user.phone);

  return (
    <main className="orders-view">
      <h2>My Orders</h2>
      {orders.length === 0 && <p className="empty-note">No orders yet. Grab something from the menu!</p>}
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </main>
  );
}
