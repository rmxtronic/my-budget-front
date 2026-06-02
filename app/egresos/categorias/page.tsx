"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { EgresoCategoria } from "../../../lib/types";
import { useToast, ToastContainer } from "../../../components/useToast";
import { useAnimatedNumber } from "../../../lib/useAnimatedNumber";
import { useAuth } from "../../../components/AuthProvider";
import DemoBanner from "../../../components/DemoBanner";

export default function EgresosCategorias() {
  const [categorias, setCategorias] = useState<EgresoCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nombreCategoria, setNombreCategoria] = useState("");
  const [montoPresupuestado, setMontoPresupuestado] = useState("");
  const [fija, setFija] = useState(true);

  const { toasts, showToast } = useToast();
  const { isDemo } = useAuth();

  const totalPresupuestado = categorias.reduce((acc, c) => acc + c.montoPresupuestado, 0);
  const animTotal = useAnimatedNumber(totalPresupuestado);
  const animCount = useAnimatedNumber(categorias.length);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.get<EgresoCategoria[]>("/egreso/categorias");
      setCategorias(data);
    } catch {
      showToast("Error al cargar categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { nombreCategoria, montoPresupuestado: Number(montoPresupuestado), fija };
    try {
      if (editandoId) {
        await api.put(`/egreso/categorias/${editandoId}`, body);
        showToast("Categoría actualizada", "success");
      } else {
        await api.post("/egreso/categorias", body);
        showToast("Categoría creada", "success");
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
      await api.delete(`/egreso/categorias/${id}`);
      showToast("Categoría eliminada", "success");
    } catch {
      showToast("Error al eliminar", "error");
    }
    setDeletingId(null);
    load();
  };

  const editar = (cat: EgresoCategoria) => {
    setEditandoId(cat.id);
    setNombreCategoria(cat.nombreCategoria);
    setMontoPresupuestado(String(cat.montoPresupuestado));
    setFija(cat.fija);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditandoId(null);
    setNombreCategoria("");
    setMontoPresupuestado("");
    setFija(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="float-icon text-5xl mb-3">🗂️</div>
        <h1 className="gradient-text font-bold mb-2" style={{ fontSize: "2.5rem", lineHeight: 1.2 }}>
          Categorías de Gasto
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem" }}>
          Define y gestiona tus categorías de presupuesto
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-8 animate-fade-in" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="glass p-5 text-center" style={{ boxShadow: "0 0 20px rgba(244,114,182,0.2)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Total presupuestado
          </p>
          <p className="font-bold count-animate" style={{ fontSize: "1.8rem", color: "#f472b6" }}>
            ${animTotal.toLocaleString()}
          </p>
        </div>
        <div className="glass p-5 text-center">
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Nº categorías
          </p>
          <p className="font-bold count-animate" style={{ fontSize: "1.8rem", color: "#60a5fa" }}>
            {animCount}
          </p>
        </div>
      </div>

      {/* Form or Demo Banner */}
      {isDemo ? <DemoBanner /> : (
      <div className="glass-form p-6 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <h2 className="font-semibold mb-5" style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)" }}>
          {editandoId
            ? <span><span style={{ color: "#f59e0b" }}>✏️</span> Editar categoría</span>
            : <span><span style={{ color: "#f472b6" }}>＋</span> Nueva categoría</span>
          }
        </h2>
        <form onSubmit={guardar}>
          <div className="mb-4">
            <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
              NOMBRE
            </label>
            <input
              className="input-glass"
              placeholder="Ej: Alimentación, Transporte..."
              value={nombreCategoria}
              onChange={(e) => setNombreCategoria(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
              MONTO PRESUPUESTADO
            </label>
            <input
              type="number"
              className="input-glass"
              placeholder="0"
              min={0}
              value={montoPresupuestado}
              onChange={(e) => setMontoPresupuestado(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 10, letterSpacing: "0.05em" }}>
              TIPO
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setFija(true)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: `1px solid ${fija ? "rgba(167,139,250,0.7)" : "rgba(255,255,255,0.15)"}`,
                  background: fija ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.05)",
                  color: fija ? "#a78bfa" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontWeight: fija ? 600 : 400,
                  transition: "all 0.2s",
                  fontSize: "0.9rem",
                }}
              >
                🔒 Fija
              </button>
              <button
                type="button"
                onClick={() => setFija(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: `1px solid ${!fija ? "rgba(96,165,250,0.7)" : "rgba(255,255,255,0.15)"}`,
                  background: !fija ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.05)",
                  color: !fija ? "#60a5fa" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontWeight: !fija ? 600 : 400,
                  transition: "all 0.2s",
                  fontSize: "0.9rem",
                }}
              >
                🔄 Variable
              </button>
            </div>
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
      </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      ) : categorias.length === 0 ? (
        <div className="glass p-10 text-center animate-fade-in">
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗂️</div>
          <p style={{ color: "rgba(255,255,255,0.45)" }}>
            No hay categorías todavía. Crea una para empezar a registrar gastos.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {categorias.map((cat, index) => (
            <div
              key={cat.id}
              className={`glass list-item-enter ${deletingId === cat.id ? "animate-slide-out" : ""}`}
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
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 30px rgba(244,114,182,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #be185d33, #9d174d33)", border: "1px solid rgba(244,114,182,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                  🗂️
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "white" }}>
                      {cat.nombreCategoria}
                    </p>
                    <span style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontWeight: 600,
                      background: cat.fija ? "rgba(139,92,246,0.25)" : "rgba(37,99,235,0.25)",
                      color: cat.fija ? "#a78bfa" : "#60a5fa",
                      border: `1px solid ${cat.fija ? "rgba(139,92,246,0.4)" : "rgba(37,99,235,0.4)"}`,
                    }}>
                      {cat.fija ? "Fija" : "Variable"}
                    </span>
                  </div>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f472b6" }}>
                    ${(cat.montoPresupuestado ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
              {!isDemo && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="btn-warning" onClick={() => editar(cat)}>Editar</button>
                  <button className="btn-danger" onClick={() => eliminar(cat.id)}>Eliminar</button>
                </div>
              )}
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
