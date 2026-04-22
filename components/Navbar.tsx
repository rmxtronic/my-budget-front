"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/ingresos/fijos", label: "Ingresos Fijos", icon: "💵" },
  { href: "/ingresos/variables", label: "Ingresos Variables", icon: "📈" },
  { href: "/egresos/categorias", label: "Categorías", icon: "🗂️" },
  { href: "/egresos/detalle", label: "Gastos", icon: "💸" },
  // TODO: cuando implementes auth, añade aquí el avatar/botón de logout
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(15, 12, 41, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            color: "white",
            paddingRight: 16,
            borderRight: "1px solid rgba(255,255,255,0.1)",
            marginRight: 4,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          💰 My Budget
        </span>

        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "14px 10px",
                fontSize: "0.85rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#a78bfa" : "rgba(255,255,255,0.5)",
                borderBottom: `2px solid ${isActive ? "#a78bfa" : "transparent"}`,
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "color 0.2s",
                flexShrink: 0,
              }}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
