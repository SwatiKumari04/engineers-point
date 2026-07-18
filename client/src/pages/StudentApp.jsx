import { useState } from "react";
import { useAuth } from "../context/auth-context.js";
import MenuPage from "./MenuPage.jsx";
import OrdersPage from "./OrdersPage.jsx";

export default function StudentApp() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("menu");

  return (
    <div className="container">
      <header className="app-header">
        <h1>Engineer's Point</h1>
        <nav className="nav">
          <button onClick={() => setTab("menu")}>Menu</button>
          <button onClick={() => setTab("orders")}>My Orders</button>
          <button onClick={logout}>Logout</button>
        </nav>
      </header>
      {tab === "menu" ? <MenuPage onOrderPlaced={() => setTab("orders")} /> : <OrdersPage />}
    </div>
  );
}
