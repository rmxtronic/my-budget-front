"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { EgresoCategoria, EgresoDetalle, SumCategoria } from "../../../lib/types";
import { useToast, ToastContainer } from "../../../components/useToast";
import { useAuth } from "../../../components/AuthProvider";
import DemoBanner from "../../../components/DemoBanner";

function barColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 60) return "#fb923c";
  if (pct >= 30) return "#fbbf24";
  return "#10b981";
}

export default function EgresosDetallePage() {
  const [detalles, setDetalles] = useState<EgresoDetalle[]>([]);
  const [categorias, setCategorias] = useState<EgresoCategoria[]>([]);
  const [resumen, setResumen] = useState<SumCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nombreLugar, setNombreLugar] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [idCategoria, setIdCategoria] = useState<string>("");

  const { toasts, showToast } = useToast();
  const { isDemo } = useAuth();

  const totalGastos = resumen.reduce((acc, c) => acc + (c.totalMonto ?? 0), 0);

  const load = async () => {
    try {
      setLoading(true);
      const [lista, cats, sum] = await Promise.all([
        api.get<EgresoDetalle[]>("/egreso/detalle"),
        api.get<EgresoCategoria[]>("/egreso/categorias"),
        api.get<SumCategoria[]>("/egreso/detalle/actual"),
      ]);
      setDetalles(lista ?? []);
      setCategorias(cats ?? []);
      setResumen(sum ?? []);
    } catch {
      showToast("Error al cargar gastos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCategoria) { showToast("Selecciona una categoría", "error"); return; }
    const body = {
      nombreLugar,
      monto: Number(monto),
      fecha: fecha || null,
      idCategoria: Number(idCategoria),
    };
    try {
      if (editandoId) {
        await api.put(`/egreso/detalle/${editandoId}`, body);
        showToast("Gasto actualizado", "success");
      } else {
        await api.post("/egreso/detalle", body);
        showToast("Gasto registrado", "success");
      }
      resetForm();
      load();
    } catch {
      showToast("Error al guardar", "error");
    }
  };

  const eliminar = async (id: number) => {
    setDeletingId(id);
    await new Promise((r) => setTimeout(r, 300));
    try {
      await api.delete(`/egreso/detalle/${id}`);
      showToast("Gasto eliminado", "success");
    } catch {
      showToast("Error al eliminar", "error");
    }
    setDeletingId(null);
    load();
  };

  const editar = (det: EgresoDetalle) => {
    if (!det.id) return;
    setEditandoId(det.id);
    setNombreLugar(det.nombreLugar);
    setMonto(String(det.monto));
    setFecha(det.fecha?.split("T")[0] || "");
    const cat = categorias.find((c) => c.nombreCategoria === det.nombreCategoria);
    setIdCategoria(cat ? String(cat.id) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditandoId(null);
    setNombreLugar("");
    setMonto("");
    setFecha("");
    setIdCategoria("");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="float-icon text-5xl mb-3">💸</div>
        <h1 className="gradient-text font-bold mb-2" style={{ fontSize: "2.5rem", lineHeight: 1.2 }}>
          Registro de Gastos
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem" }}>
          Registra y consulta tus gastos por categoría
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-8 animate-fade-in" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="glass p-5 text-center" style={{ boxShadow: "0 0 20px rgba(251,146,60,0.2)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Total gastado
          </p>
          <p className="font-bold count-animate" style={{ fontSize: "1.8rem", color: "#fb923c" }}>
            ${totalGastos.toLocaleString()}
          </p>
        </div>
        <div className="glass p-5 text-center">
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Transacciones
          </p>
          <p className="font-bold count-animate" style={{ fontSize: "1.8rem", color: "#60a5fa" }}>
            {detalles.length}
          </p>
        </div>
      </div>

      {/* Resumen por categoría */}
      {!loading && resumen.length > 0 && (
        <div className="glass-form p-6 mb-8 animate-fade-in">
          <h2 className="font-semibold mb-4" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.85)" }}>
            📊 Resumen por categoría
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resumen.map((cat) => {
              const budget = categorias.find((b) => b.nombreCategoria === cat.nombreCategoria);
              const presupuestado = budget?.montoPresupuestado ?? 0;
              const gastado = cat.totalMonto ?? 0;
              const pct = presupuestado > 0 ? (gastado / presupuestado) * 100 : 0;
              const fillPct = Math.min(pct, 100);
              const color = barColor(pct);
              const overBudget = pct >= 100;
              const excedido = Math.max(0, gastado - presupuestado);
              const saldoCat = presupuestado - gastado;
              return (
                <div key={cat.nombreCategoria}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                      {cat.nombreCategoria}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                      ${gastado.toLocaleString()}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}> / ${presupuestado.toLocaleString()}</span>
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
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
                      marginTop: 3,
                      fontSize: "0.7rem",
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form or Demo Banner */}
      {isDemo ? <DemoBanner /> : (
      <div className="glass-form p-6 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <h2 className="font-semibold mb-5" style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)" }}>
          {editandoId
            ? <span><span style={{ color: "#f59e0b" }}>✏️</span> Editar gasto</span>
            : <span><span style={{ color: "#fb923c" }}>＋</span> Nuevo gasto</span>
          }
        </h2>

        {categorias.length === 0 && !loading ? (
          <div style={{ padding: "20px", textAlign: "center", background: "rgba(251,146,60,0.1)", borderRadius: 10, border: "1px solid rgba(251,146,60,0.3)" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
              ⚠️ Primero debes crear al menos una{" "}
              <a href="/egresos/categorias" style={{ color: "#fb923c", textDecoration: "underline" }}>
                categoría de gasto
              </a>.
            </p>
          </div>
        ) : (
          <form onSubmit={guardar}>
            <div className="mb-4">
              <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
                LUGAR / CONCEPTO
              </label>
              <input
                className="input-glass"
                placeholder="Ej: Supermercado, Netflix..."
                value={nombreLugar}
                onChange={(e) => setNombreLugar(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
                MONTO
              </label>
              <input
                type="number"
                className="input-glass"
                placeholder="0"
                min={0}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
                CATEGORÍA
              </label>
              <select
                className="select-glass"
                value={idCategoria}
                onChange={(e) => setIdCategoria(e.target.value)}
                required
              >
                <option value="">Selecciona una categoría...</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombreCategoria} {cat.fija ? "(Fija)" : "(Variable)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
                FECHA (opcional)
              </label>
              <input
                type="date"
                className="input-glass"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn-primary">
                {editandoId ? "Actualizar" : "Guardar"}
              </button>
              {editandoId && (
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}
      </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      ) : detalles.length === 0 ? (
        <div className="glass p-10 text-center animate-fade-in">
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>💸</div>
          <p style={{ color: "rgba(255,255,255,0.45)" }}>No hay gastos registrados todavía.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {detalles.map((det, index) => (
            <div
              key={index}
              className={`glass list-item-enter ${det.id && deletingId === det.id ? "animate-slide-out" : ""}`}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                animationDelay: `${index * 0.05}s`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 30px rgba(251,146,60,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #92400e33, #78350f33)", border: "1px solid rgba(251,146,60,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                  💸
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "white", marginBottom: 2 }}>
                    {det.nombreLugar}
                  </p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fb923c" }}>
                    ${det.monto.toLocaleString()}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: 20, background: "rgba(251,146,60,0.2)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)" }}>
                      {det.nombreCategoria}
                    </span>
                    {det.fecha && (
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                        {new Date(det.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isDemo && (det.id ? (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="btn-warning" onClick={() => editar(det)}>Editar</button>
                  <button className="btn-danger" onClick={() => eliminar(det.id!)}>Eliminar</button>
                </div>
              ) : (
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                  solo lectura
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: "center", marginTop: 48, color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
        My Budget © {new Date().getFullYear()}
      </p>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
