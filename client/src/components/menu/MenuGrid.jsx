import MenuCard from "./MenuCard.jsx";

export default function MenuGrid({ items, getQty, onChangeQty }) {
  return (
    <div className="menu-grid">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} qty={getQty(item.id)} onChangeQty={onChangeQty} />
      ))}
    </div>
  );
}
