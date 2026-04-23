"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { SumCategoria } from "../lib/types";
import { useToast, ToastContainer } from "../components/useToast";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";

export default function Dashboard() {
  const [totalFijos, setTotalFijos] = useState(0);
  const [totalVariables, setTotalVariables] = useState(0);
  const [totalPresupuestado, setTotalPresupuestado] = useState(0);
  const [categorias, setCategorias] = useState<SumCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast } = useToast();

  const totalIngresos = totalFijos + totalVariables;
  const gastosReales = categorias.reduce((sum, c) => sum + (c.suma ?? 0), 0);
  const saldo = totalIngresos - gastosReales;

  const animFijos = useAnimatedNumber(totalFijos);
  const animVariables = useAnimatedNumber(totalVariables);
  const animPresupuestado = useAnimatedNumber(totalPresupuestado);
  const animGastos = useAnimatedNumber(gastosReales);
  const animSaldo = useAnimatedNumber(Math.abs(saldo));

  useEffect(() => {
    async function load() {
      try {
        const [fijos, variables, presupuestado, cats] = await Promise.all([
          api.get<number>("/ingresos/fijos/total"),
          api.get<number>("/ingresos/variables/total"),
          api.get<number>("/egreso/categorias/total-presupuestado"),
          api.get<SumCategoria[]>("/egreso/detalle/actual"),
        ]);
        setTotalFijos(fijos ?? 0);
        setTotalVariables(variables ?? 0);
        setTotalPresupuestado(presupuestado ?? 0);
        setCategorias(cats ?? []);
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
          {/* Stats 2x2 */}
          <div
            className="grid gap-4 mb-4 animate-fade-in"
            style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
          >
            <StatCard label="Ingresos Fijos" value={animFijos} color="#a78bfa" glow />
            <StatCard label="Ingresos Variables" value={animVariables} color="#34d399" />
            <StatCard label="Presupuestado" value={animPresupuestado} color="#f472b6" />
            <StatCard label="Gastos Reales" value={animGastos} color="#fb923c" />
          </div>

          {/* Saldo full-width */}
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

      {/* Category breakdown */}
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
              const maxSuma = Math.max(...categorias.map((c) => c.suma ?? 0), 1);
              const pct = ((cat.suma ?? 0) / maxSuma) * 100;
              return (
                <div key={cat.nombreCategoria}>
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
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f472b6" }}>
                      ${(cat.suma ?? 0).toLocaleString()}
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
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #ec4899, #f472b6)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
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
}: {
  label: string;
  value: number;
  color: string;
  glow?: boolean;
}) {
  return (
    <div className={`glass p-5 text-center ${glow ? "glow-pulse" : ""}`}>
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
    </div>
  );
}
