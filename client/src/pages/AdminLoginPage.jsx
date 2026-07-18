import { useState } from "react";
import { adminLogin } from "../api/auth.api.js";
import { useAuth } from "../context/auth-context.js";
import Modal from "../components/common/Modal.jsx";

export default function AdminLoginPage({ onSwitchToStudent }) {
  const { login } = useAuth();
  const [denied, setDenied] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const adminId = new FormData(event.target).get("adminId").trim();
    try {
      const owner = await adminLogin(adminId); // verified server-side
      login({ ...owner, adminId });
    } catch {
      setDenied(true);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left admin-bg">
        <h1>Owner<br />Panel</h1>
      </div>
      <div className="login-right">
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <input name="adminId" placeholder="Enter Admin ID" />
          <button type="submit" className="admin-btn">Login as Owner</button>
        </form>
        <p className="hint">
          <button className="link-btn" onClick={onSwitchToStudent}>← Back to Student Login</button>
        </p>
      </div>

      {denied && (
        <Modal tone="error" title="Access denied" onClose={() => setDenied(false)}>
          <p>The Admin ID you entered is incorrect.</p>
        </Modal>
      )}
    </div>
  );
}
