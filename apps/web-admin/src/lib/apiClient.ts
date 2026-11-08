/**
 * Client d'accès au service backend NestJS Core (apps/api).
 * Utilise la variable d'environnement `API_INTERNAL_URL` injectée
 * automatiquement au runtime par le Service Binding de Vercel.
 */

export function getApiBaseUrl(): string {
  // 1. Service Binding Vercel (disponible côté serveur dans les Route Handlers / Server Actions)
  if (process.env.API_INTERNAL_URL) {
    return process.env.API_INTERNAL_URL;
  }
  // 2. URL d'API externe ou publique configurée
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // 3. Fallback environnement de développement local (port par défaut NestJS)
  return 'http://localhost:4000';
}

export async function fetchFromBackend(endpoint: string, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(path, base).toString();
  return fetch(url, init);
}
