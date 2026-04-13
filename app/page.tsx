"use client";

import { useEffect, useState, useRef } from "react";

type IngresoFijo = {
  id: number;
  nombre: string;
  cantidad: number;
  fecha: string;
};

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
  exiting: boolean;
};

function useAnimatedNumber(target: number) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    const duration = 600;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * ease));
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = target;
    };

    requestAnimationFrame(step);
  }, [target]);

  return display;
}

export default function Home() {
  const [ingresos, setIngresos] = useState<IngresoFijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const totalCantidad = ingresos.reduce((acc, i) => acc + i.cantidad, 0);
  const animatedTotal = useAnimatedNumber(totalCantidad);
  const animatedElements = useAnimatedNumber(totalElements);

  const showToast = (message: string, type: "success" | "error") => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 2800);
  };

  const loadIngresos = async (pageNumber: number = 0) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ingresos/fijos?page=${pageNumber}&size=5`
      );
      const data: PageResponse<any> = await res.json();

      const listaAdaptada = data.content.map((i: any) => ({
        id: i.id,
        nombre: i.nombreIngreFi,
        cantidad: i.montoPresupuestado,
        fecha: i.fecha,
      }));

      setIngresos(listaAdaptada);
      setTotalPages(data.totalPages);
      setPage(data.number);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error("Error cargando ingresos:", error);
      showToast("Error ao carregar ingresos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngresos();
  }, []);

  const guardarIngreso = async (e: React.FormEvent) => {
    e.preventDefault();

    const ingresoData = {
      nombre,
      cantidad: Number(cantidad),
      fecha: fecha || null,
    };

    try {
      if (editandoId) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingresos/fijos/${editandoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ingresoData),
        });
        showToast("Ingreso atualizado!", "success");
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingresos/fijos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ingresoData),
        });
        showToast("Ingreso adicionado!", "success");
      }

      setNombre("");
      setCantidad("");
      setFecha("");
      setEditandoId(null);
      loadIngresos(page);
    } catch (error) {
      console.error("Error guardando ingreso:", error);
      showToast("Erro ao salvar ingreso", "error");
    }
  };

  const eliminar = async (id: number) => {
    setDeletingId(id);
    await new Promise((r) => setTimeout(r, 300));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingresos/fijos/${id}`, {
        method: "DELETE",
      });
      showToast("Ingreso eliminado", "success");
    } catch {
      showToast("Erro ao eliminar", "error");
    }
    setDeletingId(null);
    loadIngresos(page);
  };

  const editar = (ing: IngresoFijo) => {
    setEditandoId(ing.id);
    setNombre(ing.nombre);
    setCantidad(String(ing.cantidad));
    setFecha(ing.fecha?.split("T")[0] || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextPage = () => { if (page < totalPages - 1) loadIngresos(page + 1); };
  const prevPage = () => { if (page > 0) loadIngresos(page - 1); };

  return (
    <div className="bg-animated relative overflow-x-hidden">
      {/* Floating orbs */}
      <div
        className="orb"
        style={{
          width: 500,
          height: 500,
          background: "#7c3aed",
          top: -100,
          left: -150,
        }}
      />
      <div
        className="orb"
        style={{
          width: 400,
          height: 400,
          background: "#2563eb",
          bottom: 100,
          right: -100,
        }}
      />
      <div
        className="orb"
        style={{
          width: 300,
          height: 300,
          background: "#ec4899",
          top: "40%",
          right: "20%",
        }}
      />

      {/* Main content */}
      <div
        className="relative z-10 max-w-2xl mx-auto px-4 py-10"
        style={{ minHeight: "100vh" }}
      >
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="float-icon text-5xl mb-3">💰</div>
          <h1
            className="gradient-text font-bold mb-2"
            style={{ fontSize: "2.5rem", lineHeight: 1.2 }}
          >
            My Budget
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem" }}>
            Gestiona tus ingresos fijos con estilo
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 mb-8 animate-fade-in" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div
            className="glass glow-pulse p-5 text-center"
            style={{ animationDelay: "0.1s" }}
          >
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Total este mes
            </p>
            <p
              className="font-bold count-animate"
              style={{ fontSize: "1.8rem", color: "#a78bfa" }}
            >
              ${animatedTotal.toLocaleString()}
            </p>
          </div>
          <div
            className="glass p-5 text-center"
            style={{ animationDelay: "0.2s" }}
          >
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Ingresos totales
            </p>
            <p
              className="font-bold count-animate"
              style={{ fontSize: "1.8rem", color: "#60a5fa" }}
            >
              {animatedElements}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="glass-form p-6 mb-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <h2
            className="font-semibold mb-5"
            style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)" }}
          >
            {editandoId ? (
              <span>
                <span style={{ color: "#f59e0b" }}>✏️</span> Editar ingreso
              </span>
            ) : (
              <span>
                <span style={{ color: "#a78bfa" }}>＋</span> Nuevo ingreso
              </span>
            )}
          </h2>

          <form onSubmit={guardarIngreso}>
            <div className="mb-4">
              <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
                NOMBRE
              </label>
              <input
                className="input-glass"
                placeholder="Ej: Salário, Freelance..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginBottom: 6, letterSpacing: "0.05em" }}>
                CANTIDAD
              </label>
              <input
                type="number"
                className="input-glass"
                placeholder="0.00"
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
                  onClick={() => {
                    setEditandoId(null);
                    setNombre("");
                    setCantidad("");
                    setFecha("");
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 80, opacity: 1 - i * 0.2 }}
              />
            ))}
          </div>
        ) : ingresos.length === 0 ? (
          <div className="glass p-10 text-center animate-fade-in">
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗂️</div>
            <p style={{ color: "rgba(255,255,255,0.45)" }}>
              No hay ingresos registrados todavía.
            </p>
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
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 30px rgba(139,92,246,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #7c3aed33, #4f46e533)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        flexShrink: 0,
                      }}
                    >
                      💵
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "white", marginBottom: 2 }}>
                        {ing.nombre}
                      </p>
                      <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa" }}>
                        ${ing.cantidad.toLocaleString()}
                      </p>
                      {ing.fecha && (
                        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                          {new Date(ing.fecha).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="btn-warning" onClick={() => editar(ing)}>
                      Editar
                    </button>
                    <button className="btn-danger" onClick={() => eliminar(ing.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="animate-fade-in"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 24,
                  padding: "0 4px",
                }}
              >
                <button className="btn-page" onClick={prevPage} disabled={page === 0}>
                  ← Anterior
                </button>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>
                  Página <strong style={{ color: "white" }}>{page + 1}</strong> de{" "}
                  <strong style={{ color: "white" }}>{totalPages}</strong>
                </span>
                <button className="btn-page" onClick={nextPage} disabled={page >= totalPages - 1}>
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer */}
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
      </div>

      {/* Toasts */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 1000,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={toast.exiting ? "toast-exit" : "toast-enter"}
            style={{
              background:
                toast.type === "success"
                  ? "linear-gradient(135deg, #059669, #065f46)"
                  : "linear-gradient(135deg, #dc2626, #7f1d1d)",
              color: "white",
              padding: "12px 20px",
              borderRadius: 12,
              fontSize: "0.9rem",
              fontWeight: 500,
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
              minWidth: 220,
            }}
          >
            {toast.type === "success" ? "✓ " : "✕ "}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
