"use client";
import { useState, useRef } from "react";

export type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
  exiting: boolean;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const showToast = (message: string, type: "success" | "error") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        300
      );
    }, 2800);
  };

  return { toasts, showToast };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
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
  );
}
