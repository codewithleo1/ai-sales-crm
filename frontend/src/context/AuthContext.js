import { createContext, useContext, useEffect, useState } from "react";
import api, { apiError } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = logged out, obj = logged in

  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(false));
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: apiError(e.response?.data?.detail) || e.message };
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: apiError(e.response?.data?.detail) || e.message };
    }
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(false);
  };

  const refreshUser = async () => {
    const r = await api.get("/auth/me").catch(() => null);
    if (r) setUser(r.data);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
