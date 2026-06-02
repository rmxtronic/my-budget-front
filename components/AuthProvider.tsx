"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import {
  saveToken,
  getToken,
  clearToken,
  decodeJwt,
  isTokenExpired,
  DEMO_EMAIL,
  DEMO_PASSWORD,
} from "../lib/auth";

type Usuario = {
  id: number;
  email: string;
};

type AuthContextValue = {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, senha: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getToken();
    if (stored) {
      const payload = decodeJwt(stored);
      if (payload && !isTokenExpired(payload)) {
        setToken(stored);
        setUsuario({ id: Number(payload.sub), email: payload.email });
      } else {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  const applyToken = (newToken: string) => {
    saveToken(newToken);
    const payload = decodeJwt(newToken);
    if (payload) {
      setToken(newToken);
      setUsuario({ id: Number(payload.sub), email: payload.email });
    }
  };

  const login = async (email: string, senha: string) => {
    const res = await api.post<{ token: string }>("/api/auth/login", { email, senha });
    if (!res?.token) throw new Error("No token returned");
    applyToken(res.token);
  };

  const loginDemo = () => login(DEMO_EMAIL, DEMO_PASSWORD);

  const register = async (nome: string, email: string, senha: string) => {
    await api.post("/api/auth/register", { nome, email, senha });
  };

  const logout = () => {
    clearToken();
    setToken(null);
    setUsuario(null);
    router.push("/auth/login");
  };

  const isDemo = usuario?.email === DEMO_EMAIL;

  return (
    <AuthContext.Provider
      value={{ usuario, token, loading, isDemo, login, loginDemo, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
