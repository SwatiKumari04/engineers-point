import { useAuth } from "./context/auth-context.js";
import AuthPage from "./pages/AuthPage.jsx";
import OwnerDashboardPage from "./pages/OwnerDashboardPage.jsx";
import StudentApp from "./pages/StudentApp.jsx";

export default function App() {
  const { user } = useAuth();

  if (!user) return <AuthPage />;
  return user.role === "owner" ? <OwnerDashboardPage /> : <StudentApp />;
}
