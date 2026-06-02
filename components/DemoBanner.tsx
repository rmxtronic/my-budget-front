"use client";
import Link from "next/link";

export default function DemoBanner() {
  return (
    <div
      className="glass-form animate-fade-in"
      style={{
        padding: "20px 24px",
        marginBottom: 32,
        borderColor: "rgba(245, 158, 11, 0.3)",
        background: "rgba(245, 158, 11, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "1.6rem", lineHeight: 1 }}>🔒</div>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <h3
            style={{
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "rgba(255,255,255,0.9)",
              marginBottom: 4,
            }}
          >
            Modo demo — solo lectura
          </h3>
          <p
            style={{
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.4,
            }}
          >
            Estás explorando datos de demostración. Para guardar tus propios cambios, crea una cuenta gratuita.
          </p>
        </div>
        <Link
          href="/auth/register"
          className="btn-primary"
          style={{
            whiteSpace: "nowrap",
            textDecoration: "none",
            display: "inline-block",
            fontSize: "0.85rem",
            padding: "8px 18px",
          }}
        >
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
