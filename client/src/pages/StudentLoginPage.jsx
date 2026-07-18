import { useState } from "react";
import { requestStudentPassword, studentLogin } from "../api/auth.api.js";
import { useAuth } from "../context/auth-context.js";
import Modal from "../components/common/Modal.jsx";

export default function StudentLoginPage({ onSwitchToAdmin }) {
  const { login } = useAuth();
  const [details, setDetails] = useState(null); // set once the password is sent
  const [devPassword, setDevPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSendPassword = async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const name = form.get("name").trim();
    const email = form.get("email").trim().toLowerCase();
    const phone = form.get("phone").trim();

    if (!name || !email || !phone) return setError("Please fill in all details.");
    if (!/^\d{10}$/.test(phone)) return setError("Phone number must be exactly 10 digits.");

    setBusy(true);
    try {
      const result = await requestStudentPassword({ name, email, phone });
      setDevPassword(result.devPassword ?? "");
      setDetails({ name, email, phone });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const password = new FormData(event.target).get("password").trim();
    try {
      const user = await studentLogin({ email: details.email, phone: details.phone, password });
      login(user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <h1>Engineer's<br />Point</h1>
      </div>
      <div className="login-right">
        <h2>Student Login</h2>

        {/* Distinct keys make React rebuild the form on step change; without
            them the uncontrolled inputs are reused and the typed phone number
            bleeds into the password field. */}
        {!details ? (
          <form key="request" onSubmit={handleSendPassword}>
            <input name="name" placeholder="Full Name" autoComplete="name" />
            <input name="email" type="email" placeholder="College Mail ID" autoComplete="email" />
            <input name="phone" inputMode="numeric" placeholder="Phone Number" autoComplete="tel" />
            <button type="submit" disabled={busy}>
              {busy ? "Sending..." : "Send Password to Email"}
            </button>
          </form>
        ) : (
          <form key="login" onSubmit={handleLogin}>
            <p className="hint">
              Password sent to <strong>{details.email}</strong>. It is valid for 10 minutes.
            </p>
            {devPassword && (
              <p className="hint">Dev mode (no SMTP configured): your password is <strong>{devPassword}</strong></p>
            )}
            <input name="password" placeholder="Password from your email" autoComplete="one-time-code" />
            <button type="submit">Login</button>
            <p className="hint">
              <button type="button" className="link-btn" onClick={() => setDetails(null)}>
                Use different details
              </button>
            </p>
          </form>
        )}

        <p className="hint">
          <button className="link-btn" onClick={onSwitchToAdmin}>Admin Login</button>
        </p>
      </div>

      {error && (
        <Modal tone="error" title="Check your details" onClose={() => setError("")}>
          <p>{error}</p>
        </Modal>
      )}
    </div>
  );
}
