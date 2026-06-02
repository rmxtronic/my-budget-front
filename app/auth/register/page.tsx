"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/AuthProvider";
import { useToast, ToastContainer } from "../../../components/useToast";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const { toasts, showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (senha.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    setLoading(true);
    try {
      await register(nome, email, senha);
      showToast("Cuenta creada. Inicia sesión", "success");
      setTimeout(() => router.push("/auth/login"), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("já cadastrado") || msg.includes("ya cadastrado") || msg.includes("Email")) {
        if (msg.toLowerCase().includes("email") && (msg.includes("cadastrado") || msg.includes("registrado"))) {
          showToast("Este email ya está registrado", "error");
        } else if (msg.includes("well-formed email") || msg.includes("formato")) {
          showToast("Formato de email inválido", "error");
        } else {
          showToast("Error en el correo electrónico", "error");
        }
      } else if (msg.includes("must not be blank")) {
        showToast("Completa todos los campos", "error");
      } else if (msg.toLowerCase().includes("size") || msg.includes("6")) {
        showToast("La contraseña debe tener al menos 6 caracteres", "error");
      } else {
        showToast("Error al crear la cuenta", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="glass-form animate-fade-in"
      style={{ width: "100%", maxWidth: 420, padding: "40px 32px" }}
    >
      <div className="text-center" style={{ marginBottom: 32 }}>
        <div className="float-icon" style={{ fontSize: "3rem", marginBottom: 8 }}>
          📝
        </div>
        <h1
          className="gradient-text font-bold"
          style={{ fontSize: "2rem", lineHeight: 1.2 }}
        >
          Crear cuenta
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.9rem",
            marginTop: 8,
          }}
        >
          Empieza a llevar tu presupuesto personal
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
            NOMBRE
          </label>
          <input
            type="text"
            className="input-glass"
            placeholder="Tu nombre"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            disabled={loading}
            autoComplete="name"
          />
        </div>

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
            disabled={loading}
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
            CONTRASEÑA{" "}
            <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>
              (mínimo 6 caracteres)
            </span>
          </label>
          <input
            type="password"
            className="input-glass"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{
            width: "100%",
            opacity: loading ? 0.5 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          marginTop: 24,
          color: "rgba(255,255,255,0.4)",
          fontSize: "0.85rem",
        }}
      >
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/auth/login"
          style={{ color: "#a78bfa", textDecoration: "underline" }}
        >
          Iniciar sesión
        </Link>
      </p>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
