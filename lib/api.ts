import { getToken, clearToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const isAuthEndpoint = path.startsWith("/api/auth/");
  const token = !isAuthEndpoint ? getToken() : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if ((res.status === 401 || res.status === 403) && !isAuthEndpoint) {
    if (typeof window !== "undefined") {
      clearToken();
      window.location.assign("/auth/login");
    }
  }

  if (res.status === 204) return null as T;

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const text = await res.text();
      if (text) message = text;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch<null>(path, { method: "DELETE" }),
};
