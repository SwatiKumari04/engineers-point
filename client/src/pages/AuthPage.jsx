import { useState } from "react";
import AdminLoginPage from "./AdminLoginPage.jsx";
import StudentLoginPage from "./StudentLoginPage.jsx";

export default function AuthPage() {
  const [mode, setMode] = useState("student");

  return mode === "student" ? (
    <StudentLoginPage onSwitchToAdmin={() => setMode("admin")} />
  ) : (
    <AdminLoginPage onSwitchToStudent={() => setMode("student")} />
  );
}
