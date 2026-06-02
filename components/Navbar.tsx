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

const mobileLinks = [
  { href: "/", label: "Dashboard", icon: "📊" },
  ...ingresosLinks,
  ...mainLinks,
];

export default function Navbar() {
  const pathname = usePathname();
  const [ingresosOpen, setIngresosOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/auth/")) return null;

  return (
    <nav className="sticky top-0 z-[100] border-b border-white/[0.08] backdrop-blur-[20px] bg-[rgba(15,12,41,0.92)]">
      <div className="max-w-[1100px] mx-auto px-4 flex items-center gap-1">
        {/* Logo -> Dashboard */}
        <Link
          href="/"
          className={`
            flex items-center gap-2 pr-4 md:mr-2 md:border-r md:border-white/10
            font-bold text-base whitespace-nowrap shrink-0
            min-h-[48px] transition-colors
            ${pathname === "/" ? "text-violet-400" : "text-white hover:text-violet-300"}
          `}
        >
          💰 HogarBudget
        </Link>

        {/* Desktop nav: Ingresos dropdown + main links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1">
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

        {/* Mobile hamburger (visible only <md) */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden ml-auto flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/5 transition-colors text-white"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer: slides down when open (visible only <md) */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[rgba(15,12,41,0.97)] backdrop-blur-[20px] animate-fade-in">
          <div className="max-w-[1100px] mx-auto px-2 py-2 flex flex-col gap-1">
            {mobileLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-base rounded-md
                    transition-colors
                    ${isActive
                      ? "font-semibold text-violet-400 bg-white/5"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
