"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const ingresosLinks = [
  { href: "/ingresos/fijos", label: "Ingresos Fijos", icon: "💵" },
  { href: "/ingresos/variables", label: "Ingresos Variables", icon: "📈" },
];

const mainLinks = [
  { href: "/egresos/categorias", label: "Categorías", icon: "🗂️" },
  { href: "/egresos/detalle", label: "Gastos", icon: "💸" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [ingresosOpen, setIngresosOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isIngresosActive = ingresosLinks.some((l) => pathname === l.href);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIngresosOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-[100] border-b border-white/[0.08] backdrop-blur-[20px] bg-[rgba(15,12,41,0.92)]">
      <div className="max-w-[1100px] mx-auto px-4 flex items-center gap-1">
        {/* Logo -> Dashboard */}
        <Link
          href="/"
          className={`
            flex items-center gap-2 pr-4 mr-2 border-r border-white/10
            font-bold text-base whitespace-nowrap shrink-0
            min-h-[48px] transition-colors
            ${pathname === "/" ? "text-violet-400" : "text-white hover:text-violet-300"}
          `}
        >
          💰 HogarBudget
        </Link>

        {/* Dropdown: Ingresos */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            onClick={() => setIngresosOpen((v) => !v)}
            className={`
              flex items-center gap-1.5 px-3 min-h-[48px] text-sm
              border-b-2 whitespace-nowrap transition-colors cursor-pointer
              ${isIngresosActive
                ? "font-semibold text-violet-400 border-violet-400"
                : "font-normal text-white/50 border-transparent hover:text-white/80"
              }
            `}
          >
            <span>💰</span>
            Ingresos
            <svg
              className={`w-3.5 h-3.5 ml-0.5 transition-transform ${ingresosOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {ingresosOpen && (
            <div className="absolute top-full left-0 mt-1 min-w-[200px] rounded-lg bg-[rgba(15,12,41,0.97)] border border-white/10 shadow-xl py-1 z-50">
              {ingresosLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIngresosOpen(false)}
                    className={`
                      flex items-center gap-2 px-4 min-h-[44px] text-sm
                      transition-colors
                      ${isActive
                        ? "font-semibold text-violet-400 bg-white/5"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Main links: Categorías, Gastos */}
        {mainLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-1.5 px-3 min-h-[48px] text-sm
                border-b-2 whitespace-nowrap transition-colors shrink-0
                ${isActive
                  ? "font-semibold text-violet-400 border-violet-400"
                  : "font-normal text-white/50 border-transparent hover:text-white/80"
                }
              `}
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
