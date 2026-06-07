"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import type { SumCategoria, EgresoCategoria } from "../lib/types";
import { useToast, ToastContainer } from "../components/useToast";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";
import { useAuth } from "../components/AuthProvider";

function barColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 60) return "#fb923c";
  if (pct >= 30) return "#fbbf24";
  return "#10b981";
}

export default function Dashboard() {
  const [totalFijos, setTotalFijos] = useState(0);
  const [totalVariables, setTotalVariables] = useState(0);
  const [totalPresupuestado, setTotalPresupuestado] = useState(0);
  const [categorias, setCategorias] = useState<SumCategoria[]>([]);
  const [presupuestos, setPresupuestos] = useState<EgresoCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast } = useToast();
  const { usuario, isDemo, logout } = useAuth();
  const router = useRouter();

  const displayName = usuario?.email.split("@")[0] ?? "";

  const handleAuthAction = () => {
    if (isDemo) {
      router.push("/auth/register");
    } else {
      logout();
    }
  };

  const totalIngresos = totalFijos + totalVariables;
  const gastosReales = categorias.reduce((sum, c) => sum + (c.totalMonto ?? 0), 0);
  const saldo = totalIngresos - gastosReales;

  const animFijos = useAnimatedNumber(totalFijos);
  const animVariables = useAnimatedNumber(totalVariables);
  const animPresupuestado = useAnimatedNumber(totalPresupuestado);
  const animGastos = useAnimatedNumber(gastosReales);
  const animSaldo = useAnimatedNumber(Math.abs(saldo));

  useEffect(() => {
    async function load() {
      try {
        const [fijos, variables, presupuestado, cats, presup] = await Promise.all([
          api.get<number>("/ingresos/fijos/total"),
          api.get<number>("/ingresos/variables/total"),
          api.get<number>("/egreso/categorias/total-presupuestado"),
          api.get<SumCategoria[]>("/egreso/detalle/actual"),
          api.get<EgresoCategoria[]>("/egreso/categorias"),
        ]);
        setTotalFijos(fijos ?? 0);
        setTotalVariables(variables ?? 0);
        setTotalPresupuestado(presupuestado ?? 0);
        setCategorias(cats ?? []);
        setPresupuestos(presup ?? []);
      } catch {
        showToast("Error al cargar el dashboard", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* User bar (replaces Navbar) */}
      {usuario && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
            {displayName}
          </span>
          {isDemo && (
            <span
              style={{
                fontSize: "0.65rem",
                padding: "2px 8px",
                borderRadius: 4,
                background: "rgba(245, 158, 11, 0.2)",
                color: "rgb(252, 211, 77)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              DEMO
            </span>
          )}
          <button
            onClick={handleAuthAction}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: "5px 12px",
              borderRadius: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgb(196, 181, 253)";
              e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.4)";
              e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {isDemo ? "Crear cuenta" : "Salir"}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="float-icon text-5xl mb-3">📊</div>
        <h1
          className="gradient-text font-bold mb-2"
          style={{ fontSize: "2.5rem", lineHeight: 1.2 }}
        >
          Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem" }}>
          Resumen de tu presupuesto personal
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 100 }} />
          ))}
          <div className="skeleton" style={{ height: 110, gridColumn: "1 / -1" }} />
        </div>
      ) : (
        <>
          {/* Stats 2x2 — clickable navigation entry points */}
          <div
            className="grid gap-4 mb-4 animate-fade-in"
            style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
          >
            <StatCard
              label="Ingresos Fijos"
              value={animFijos}
              color="#a78bfa"
              glow
              href="/ingresos/fijos"
            />
            <StatCard
              label="Ingresos Variables"
              value={animVariables}
              color="#34d399"
              href="/ingresos/variables"
            />
            <StatCard
              label="Presupuestado"
              value={animPresupuestado}
              color="#f472b6"
              href="/egresos/categorias"
            />
            <StatCard
              label="Gastos Reales"
              value={animGastos}
              color="#fb923c"
              href="/egresos/detalle"
            />
          </div>

          {/* Saldo full-width — derived metric, not clickable */}
          <div
            className={`glass p-6 text-center mb-8 animate-fade-in ${saldo >= 0 ? "glow-pulse" : ""}`}
            style={{
              borderColor: saldo < 0 ? "rgba(239,68,68,0.4)" : undefined,
              animationDelay: "0.15s",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.85rem",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Saldo Disponible
            </p>
            <p
              className="font-bold"
              style={{ fontSize: "2.8rem", color: saldo >= 0 ? "#60a5fa" : "#ef4444" }}
            >
              {saldo < 0 ? "-" : ""}${animSaldo.toLocaleString()}
            </p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", marginTop: 6 }}>
              Ingresos ${totalIngresos.toLocaleString()} — Gastos ${gastosReales.toLocaleString()}
            </p>
          </div>
        </>
      )}

      {/* Category breakdown — each row is a link to detalle */}
      {!loading && categorias.length > 0 && (
        <div className="glass-form p-6 animate-fade-in">
          <h2
            className="font-semibold mb-5"
            style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)" }}
          >
            💸 Gastos por Categoría
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categorias.map((cat) => {
              const budget = presupuestos.find((b) => b.nombreCategoria === cat.nombreCategoria);
              const presupuestado = budget?.montoPresupuestado ?? 0;
              const gastado = cat.totalMonto ?? 0;
              const pct = presupuestado > 0 ? (gastado / presupuestado) * 100 : 0;
              const fillPct = Math.min(pct, 100);
              const color = barColor(pct);
              const overBudget = pct >= 100;
              const excedido = Math.max(0, gastado - presupuestado);
              const saldoCat = presupuestado - gastado;
              return (
                <Link
                  key={cat.nombreCategoria}
                  href="/egresos/detalle"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                    padding: "4px 8px",
                    margin: "-4px -8px",
                    borderRadius: 8,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>
                      {cat.nombreCategoria}
                    </span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                      ${gastado.toLocaleString()}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}> / ${presupuestado.toLocaleString()}</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        width: `${fillPct}%`,
                        background: color,
                        transition: "width 0.6s ease, background 0.3s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: "0.75rem",
                      textAlign: "right",
                      color: overBudget ? "#ef4444" : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {presupuestado === 0
                      ? "Sin presupuesto definido"
                      : overBudget
                        ? `Excedido por $${excedido.toLocaleString()} (${Math.round(pct)}%)`
                        : `${Math.round(pct)}% — Saldo: $${saldoCat.toLocaleString()}`}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!loading && categorias.length === 0 && (
        <div className="glass p-10 text-center animate-fade-in">
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📭</div>
          <p style={{ color: "rgba(255,255,255,0.45)" }}>
            Aún no hay gastos registrados. Comienza añadiendo categorías y gastos.
          </p>
        </div>
      )}

      <p
        style={{
          textAlign: "center",
          marginTop: 48,
          color: "rgba(255,255,255,0.2)",
          fontSize: "0.75rem",
        }}
      >
        My Budget © {new Date().getFullYear()}
      </p>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  glow,
  href,
}: {
  label: string;
  value: number;
  color: string;
  glow?: boolean;
  href?: string;
}) {
  const cardClass = `glass p-5 text-center ${glow ? "glow-pulse" : ""}`;

  const content = (
    <>
      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.8rem",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </p>
      <p className="font-bold count-animate" style={{ fontSize: "1.8rem", color }}>
        ${value.toLocaleString()}
      </p>
      {href && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            color: "rgba(255,255,255,0.25)",
            fontSize: "0.9rem",
          }}
          aria-hidden="true"
        >
          →
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cardClass}
        style={{
          position: "relative",
          display: "block",
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = `0 12px 40px ${color}33`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClass} style={{ position: "relative" }}>
      {content}
    </div>
  );
}
