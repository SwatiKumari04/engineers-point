import { useState } from "react";

const upiQrUrl = (amount) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `upi://pay?pa=nightcanteen@nitjsr&am=${amount}`,
  )}`;

export default function CheckoutModal({ total, onConfirm, onClose, payLabel = "Pay via UPI" }) {
  const [step, setStep] = useState("select");
  const [placing, setPlacing] = useState(false);

  // PAID sends the order to the kitchen; CANCEL places nothing.
  const handlePaid = async () => {
    setPlacing(true);
    try {
      await onConfirm();
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {step === "select" ? (
          <>
            <h3>Payment Mode</h3>
            <p className="checkout-total">₹{total}</p>
            <button className="btn btn-upi btn-block" onClick={() => setStep("upi")}>
              {payLabel}
            </button>
          </>
        ) : (
          <>
            <h3 className="upi-title">NIT JAMSHEDPUR NIGHT CANTEEN</h3>
            <div className="qr-box">
              <img src={upiQrUrl(total)} alt="UPI payment QR code" />
            </div>
            <button className="btn btn-success btn-block" disabled={placing} onClick={handlePaid}>
              {placing ? "Placing order..." : "PAID"}
            </button>
          </>
        )}
        <button className="btn btn-danger btn-block" onClick={onClose}>CANCEL</button>
      </div>
    </div>
  );
}
