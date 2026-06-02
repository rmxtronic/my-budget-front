"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { PageResponse, IngresoVariable } from "../../../lib/types";
import { useToast, ToastContainer } from "../../../components/useToast";
import { useAnimatedNumber } from "../../../lib/useAnimatedNumber";
import { useAuth } from "../../../components/AuthProvider";
import DemoBanner from "../../../components/DemoBanner";

export default function IngresosVariablesPage() {
  const [ingresos, setIngresos] = useState<IngresoVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { toasts, showToast } = useToast();
  const { isDemo } = useAuth();

  const totalCantidad = ingresos.reduce((acc, i) => acc + i.cantidad, 0);
  const animTotal = useAnimatedNumber(totalCantidad);
  const animElements = useAnimatedNumber(totalElements);

  const load = async (pageNumber = 0) => {
    try {
      setLoading(true);
      const data = await api.get<PageResponse<IngresoVariable>>(
        `/ingresos/variables?page=${pageNumber}&size=5`
      );
      setIngresos(data.content);
      setTotalPages(data.totalPages);
      setPage(data.number);
      setTotalElements(data.totalElements);
    } catch {
      showToast("Error al cargar ingresos variables", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { nombre, cantidad: Number(cantidad), fecha: fecha || null };
    try {
      if (editandoId) {
        await api.put(`/ingresos/variables/${editandoId}`, body);
        showToast("Ingreso actualizado", "success");
      } else {
        await api.post("/ingresos/variables", body);
        showToast("Ingreso añadido", "success");
      }
      setNombre(""); setCantidad(""); setFecha(""); setEditandoId(null);
      load(page);
    } catch {
      showToast("Error al guardar", "error");
    }
  };

  const eliminar = async (id: number) => {
    setDeletingId(id);
    await new Promise((r) => setTimeout(r, 300));
    try {
      await api.delete(`/ingresos/variables/${id}`);
      showToast("Ingreso eliminado", "success");
    } catch {
      showToast("Error al eliminar", "error");
    }
    setDeletingId(null);
    load(page);
  };

  const editar = (ing: IngresoVariable) => {
    setEditandoId(ing.id);
    setNombre(ing.nombre);
    setCantidad(String(ing.cantidad));
    setFecha(ing.fecha?.split("T")[0] || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="float-icon text-5xl mb-3">📈</div>
        <h1 className="gradient-text font-bold mb-2" style={{ fontSize: "2.5rem", lineHeight: 1.2 }}>
          Ingresos Variables
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem" }}>
          Registra ingresos esporádicos o extras
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-8 animate-fade-in" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="glass p-5 text-center" style={{ boxShadow: "0 0 20px rgba(52,211,153,0.2)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Total en esta página
          </p>
          <p className="font-bold count-animate" style={{ fontSize: "1.8rem", color: "#34d399" }}>
            ${animTotal.toLocaleString()}
          </p>
        </div>
        <div className="glass p-5 text-center">
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Total registros
          </p>
          <p className="font-bold count-animate" style={{ fontSize: "1.8rem", color: "#60a5fa" }}>
            {animElements}
          </p>
        </div>
      </div>

      {/* Form or Demo Banner */}
      {isDemo ? <DemoBanner /> : (
      <div className="glass-form p-6 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <h2 className="font-semibold mb-5" style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)" }}>
          {editandoId
            ? <span><span style={{ color: "#f59e0b" }}>✏️</span> Editar ingreso</span>
            : <span><span style={{ color: "#34d399" }}>＋</span> Nuevo ingreso variable</span>
          }
        </h2>
        <form onSubmit={guardar}>
          <div className="mb-4">
            <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
              NOMBRE
            </label>
            <input
              className="input-glass"
              placeholder="Ej: Freelance, Venta, Bonus..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
              CANTIDAD (mín. 1000)
            </label>
            <input
              type="number"
              className="input-glass"
              placeholder="0"
              min={1000}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
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
              <button
                type="button"
                className="btn-cancel"
                onClick={() => { setEditandoId(null); setNombre(""); setCantidad(""); setFecha(""); }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      ) : ingresos.length === 0 ? (
        <div className="glass p-10 text-center animate-fade-in">
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📭</div>
          <p style={{ color: "rgba(255,255,255,0.45)" }}>No hay ingresos variables registrados todavía.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ingresos.map((ing, index) => (
              <div
                key={ing.id}
                className={`glass list-item-enter ${deletingId === ing.id ? "animate-slide-out" : ""}`}
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  animationDelay: `${index * 0.07}s`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 30px rgba(52,211,153,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #059669, #065f46)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                    📈
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "white", marginBottom: 2 }}>
                      {ing.nombre}
                    </p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#34d399" }}>
                      ${ing.cantidad.toLocaleString()}
                    </p>
                    {ing.fecha && (
                      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                        {new Date(ing.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
                {!isDemo && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="btn-warning" onClick={() => editar(ing)}>Editar</button>
                    <button className="btn-danger" onClick={() => eliminar(ing.id)}>Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, padding: "0 4px" }}>
              <button className="btn-page" onClick={() => load(page - 1)} disabled={page === 0}>
                ← Anterior
              </button>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>
                Página <strong style={{ color: "white" }}>{page + 1}</strong> de{" "}
                <strong style={{ color: "white" }}>{totalPages}</strong>
              </span>
              <button className="btn-page" onClick={() => load(page + 1)} disabled={page >= totalPages - 1}>
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <p style={{ textAlign: "center", marginTop: 48, color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
        My Budget © {new Date().getFullYear()}
      </p>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
