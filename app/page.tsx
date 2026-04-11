"use client";

import { useEffect, useState } from "react";

type IngresoFijo = {
  id: number;
  nombre: string; // 👈 antes era nombreIngreFi
  cantidad: number; // 👈 antes era montoPresupuestado
  fecha: string;
};

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

export default function Home() {
  const [ingresos, setIngresos] = useState<IngresoFijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);

  // ✅ Cargar ingresos con paginación
  const loadIngresos = async (pageNumber: number = 0) => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:8080/ingresos/fijos?page=${pageNumber}&size=5`
      );
      const data: PageResponse<any> = await res.json();

      // adaptamos los nombres recibidos del backend a los que usamos aquí
      const listaAdaptada = data.content.map((i: any) => ({
        id: i.id,
        nombre: i.nombreIngreFi, // 👈 adaptamos del backend
        cantidad: i.montoPresupuestado, // 👈 adaptamos del backend
        fecha: i.fecha,
      }));

      setIngresos(listaAdaptada);
      setTotalPages(data.totalPages);
      setPage(data.number);
    } catch (error) {
      console.error("Error cargando ingresos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngresos();
  }, []);

  // ✅ Crear o actualizar ingreso
  const guardarIngreso = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔹 Enviar los nombres que espera tu backend
    const ingresoData = {
      nombre: nombre,
      cantidad: Number(cantidad),
      fecha: fecha || null,
    };

    try {
      if (editandoId) {
        // PUT para editar
        await fetch(`http://localhost:8080/ingresos/fijos/${editandoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ingresoData),
        });
      } else {
        // POST para crear
        await fetch("http://localhost:8080/ingresos/fijos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ingresoData),
        });
      }

      setNombre("");
      setCantidad("");
      setFecha("");
      setEditandoId(null);
      loadIngresos(page);
    } catch (error) {
      console.error("Error guardando ingreso:", error);
    }
  };

  // ✅ Eliminar
  const eliminar = async (id: number) => {
    await fetch(`http://localhost:8080/ingresos/fijos/${id}`, {
      method: "DELETE",
    });
    loadIngresos(page);
  };

  // ✅ Editar
  const editar = (ing: IngresoFijo) => {
    setEditandoId(ing.id);
    setNombre(ing.nombre);
    setCantidad(String(ing.cantidad));
    setFecha(ing.fecha?.split("T")[0] || "");
  };

  // ✅ Paginación
  const nextPage = () => {
    if (page < totalPages - 1) loadIngresos(page + 1);
  };

  const prevPage = () => {
    if (page > 0) loadIngresos(page - 1);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Ingresos Fijos</h1>

      {/* ✅ Formulario */}
      <form
        onSubmit={guardarIngreso}
        className="mb-8 p-4 bg-gray-100 rounded-lg shadow"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editandoId ? "Editar ingreso" : "Agregar nuevo ingreso"}
        </h2>

        <div className="mb-3">
          <label className="block font-medium">Nombre</label>
          <input
            className="w-full border p-2 rounded"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block font-medium">Cantidad</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block font-medium">Fecha (opcional)</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {editandoId ? "Actualizar" : "Guardar"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={() => {
                setEditandoId(null);
                setNombre("");
                setCantidad("");
                setFecha("");
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* ✅ Lista */}
      {loading ? (
        <p>Cargando...</p>
      ) : ingresos.length === 0 ? (
        <p>No hay ingresos registrados.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {ingresos.map((ing) => (
              <li
                key={ing.id}
                className="flex justify-between items-center p-3 border rounded-lg shadow"
              >
                <div>
                  <p className="font-semibold">{ing.nombre}</p>
                  <p className="text-gray-600">
                    ${ing.cantidad.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(ing.fecha).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    onClick={() => editar(ing)}
                  >
                    Editar
                  </button>

                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => eliminar(ing.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* ✅ Paginación */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={prevPage}
              disabled={page === 0}
              className={`px-4 py-2 rounded ${
                page === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              ← Anterior
            </button>

            <span className="text-gray-600">
              Página {page + 1} de {totalPages}
            </span>

            <button
              onClick={nextPage}
              disabled={page >= totalPages - 1}
              className={`px-4 py-2 rounded ${
                page >= totalPages - 1
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
}