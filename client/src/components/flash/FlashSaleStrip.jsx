import { useState } from "react";
import { useAuth } from "../../context/auth-context.js";
import { useFlashSales } from "../../hooks/useFlashSales.js";
import Modal from "../common/Modal.jsx";
import CheckoutModal from "../menu/CheckoutModal.jsx";
import FlashSaleCard from "./FlashSaleCard.jsx";

export default function FlashSaleStrip() {
  const { user } = useAuth();
  const { sales, claim, confirm, release } = useFlashSales();
  const [claimingId, setClaimingId] = useState(null);
  const [paying, setPaying] = useState(null); // sale reserved, awaiting payment
  const [result, setResult] = useState(null);

  if (sales.length === 0) return null;

  const customer = { name: user.name, phone: user.phone, email: user.email };

  // Grab reserves one unit; the order is only placed after PAID.
  const handleGrab = async (sale) => {
    setClaimingId(sale.id);
    try {
      await claim(sale.id, customer);
      setPaying(sale);
    } catch (err) {
      setResult({
        tone: "error",
        title: err.code === "SOLD_OUT" ? "Out of stock" : "Could not claim",
        message: err.message,
      });
    } finally {
      setClaimingId(null);
    }
  };

  const handlePaid = async () => {
    const sale = paying;
    setPaying(null);
    try {
      const { order } = await confirm(sale.id, customer);
      setResult({
        tone: "success",
        title: "Deal grabbed",
        message: `${sale.itemName} is yours for ₹${sale.salePrice}. Order ${order.orderNo} is being prepared.`,
      });
    } catch (err) {
      setResult({ tone: "error", title: "Could not place order", message: err.message });
    }
  };

  // CANCEL returns the reserved unit to the sale; nothing is placed.
  const handleCancel = async () => {
    const sale = paying;
    setPaying(null);
    try {
      await release(sale.id, customer);
    } catch {
      // The unit could not be returned (e.g. the sale ended); nothing to show.
    }
  };

  return (
    <section className="flash-strip">
      {sales.map((sale) => (
        <FlashSaleCard
          key={sale.id}
          sale={sale}
          claiming={claimingId === sale.id}
          onGrab={() => handleGrab(sale)}
        />
      ))}
      {paying && (
        <CheckoutModal
          total={paying.salePrice}
          payLabel="PAY"
          onConfirm={handlePaid}
          onClose={handleCancel}
        />
      )}
      {result && (
        <Modal tone={result.tone} title={result.title} onClose={() => setResult(null)}>
          <p>{result.message}</p>
        </Modal>
      )}
    </section>
  );
}
