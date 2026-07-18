import { setItemAvailability } from "../../api/menu.api.js";
import { useAuth } from "../../context/auth-context.js";
import { useMenu } from "../../hooks/useMenu.js";

export default function MenuPanel() {
  const { user } = useAuth();
  const { menu, refresh } = useMenu();

  const toggle = async (item) => {
    await setItemAvailability(item.id, !item.available, user.adminId);
    await refresh();
  };

  return (
    <section className="menu-panel">
      <h3>Menu Availability</h3>
      <div className="menu-panel-grid">
        {menu.map((item) => (
          <div key={item.id} className={`menu-panel-row${item.available ? "" : " oos"}`}>
            <span>{item.name}</span>
            <button
              className={`btn ${item.available ? "btn-danger" : "btn-success"}`}
              onClick={() => toggle(item)}
            >
              {item.available ? "Out of stock" : "Back in stock"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
