"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/AuthProvider";
import { useToast, ToastContainer } from "../../../components/useToast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const router = useRouter();
  const { toasts, showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || demoLoading) return;
    setLoading(true);
    try {
      await login(email, senha);
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Credenciais")) {
        showToast("Email o contraseña incorrectos", "error");
      } else if (msg.includes("must not be blank")) {
        showToast("Completa todos los campos", "error");
      } else if (msg.includes("well-formed email") || msg.includes("Email")) {
        showToast("Formato de email inválido", "error");
      } else {
        showToast("Error al iniciar sesión", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    if (loading || demoLoading) return;
    setDemoLoading(true);
    try {
      await loginDemo();
      router.push("/");
    } catch {
      showToast("No se pudo iniciar sesión como demo", "error");
    } finally {
      setDemoLoading(false);
    }
  };

  const disabled = loading || demoLoading;

  return (
    <div
      className="glass-form animate-fade-in"
      style={{ width: "100%", maxWidth: 420, padding: "40px 32px" }}
    >
      <div className="text-center" style={{ marginBottom: 32 }}>
        <div className="float-icon" style={{ fontSize: "3rem", marginBottom: 8 }}>
          💰
        </div>
        <h1
          className="gradient-text font-bold"
          style={{ fontSize: "2rem", lineHeight: 1.2 }}
        >
          Iniciar sesión
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.9rem",
            marginTop: 8,
          }}
        >
          Accede a tu presupuesto personal
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.55)",
              marginBottom: 6,
              letterSpacing: "0.08em",
            }}
          >
            CORREO ELECTRÓNICO
          </label>
          <input
            type="email"
            className="input-glass"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={disabled}
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.55)",
              marginBottom: 6,
              letterSpacing: "0.08em",
            }}
          >
            CONTRASEÑA
          </label>
          <input
            type="password"
            className="input-glass"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            disabled={disabled}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={disabled}
          style={{
            width: "100%",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Iniciando..." : "Iniciar sesión"}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "24px 0",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>
          o
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
      </div>

      <button
        type="button"
        onClick={handleDemo}
        className="btn-cancel"
        disabled={disabled}
        style={{
          width: "100%",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {demoLoading ? "Cargando demo..." : "🔍 Probar como demo"}
      </button>

      <p
        style={{
          textAlign: "center",
          marginTop: 24,
          color: "rgba(255,255,255,0.4)",
          fontSize: "0.85rem",
        }}
      >
        ¿No tienes cuenta?{" "}
        <Link
          href="/auth/register"
          style={{
            color: "#a78bfa",
            textDecoration: "underline",
          }}
        >
          Crear cuenta
        </Link>
      </p>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
