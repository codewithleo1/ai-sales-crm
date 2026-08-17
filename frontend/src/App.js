import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Assistant from "./pages/Assistant";
import Sequences from "./pages/Sequences";
import AtRisk from "./pages/AtRisk";
import Contacts from "./pages/Contacts";
import Team from "./pages/Team";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";

function Loader() {
  return (
    <div className="app-bg h-screen flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user } = useAuth();
  if (user === null) return <Loader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="sequences" element={<Sequences />} />
            <Route path="at-risk" element={<AtRisk />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="team" element={<Team />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
