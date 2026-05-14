export type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

export type IngresoFijo = {
  id: number;
  nombre: string;
  cantidad: number;
  fecha: string;
};

export type IngresoVariable = {
  id: number;
  nombre: string;
  cantidad: number;
  fecha: string;
};

export type EgresoCategoria = {
  id: number;
  nombreCategoria: string;
  montoPresupuestado: number;
  fija: boolean;
};

// O backend retorna DatosEDSalida (sem id) no GET /egreso/detalle
// Para editar/eliminar um detalle, o backend precisa incluir o id na resposta
export type EgresoDetalle = {
  id?: number;
  nombreLugar: string;
  monto: number;
  fecha?: string;
  nombreCategoria: string;
};

export type SumCategoria = {
  nombreCategoria: string;
  totalMonto: number;
};
