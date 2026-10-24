import { Navigate, Route, Routes } from "react-router-dom";
import { ReactElement } from "react";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

function Protected({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-[180px] place-items-center gap-2.5 pt-20 text-fog">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-mint/20 border-t-mint" />
        <p>Loading TaskFlow…</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
