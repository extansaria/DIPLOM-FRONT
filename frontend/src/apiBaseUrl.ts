/**
 * Базовый URL API. По умолчанию — same-origin (`""`), чтобы через nginx проксировался `/api`
 * (локальный Docker, Cloud Pub и т.д.). Переопределение: window.__AI_API_URL__ в index.html.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") return "http://localhost:3001";
  const o = (window as Window & { __AI_API_URL__?: string }).__AI_API_URL__;
  if (typeof o === "string" && o.trim() !== "") return o.trim();
  return "";
}
