import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ayfgfvhqwacxsjqbyfjm.supabase.co';
// Clé utilisée par le SDK client:
// Dans le navigateur, on ne passe JAMAIS de clé préfixée 'sb_secret_' pour éviter le blocage
// natif de @supabase/supabase-js ('Forbidden use of secret API key in browser').
// Le proxy /api/supabase se charge d'injecter la véritable clé de service sécurisée côté serveur.
const CLIENT_KEY =
  typeof window !== 'undefined'
    ? 'kalansso-browser-client-key'
    : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'kalansso-browser-client-key');

// Custom fetch pour le navigateur:
// Relaye de façon transparente les requêtes via la route proxy locale sécurisée /api/supabase.
const proxyFetch: typeof fetch = async (input, init) => {
  if (typeof window !== 'undefined') {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (urlStr.startsWith(SUPABASE_URL)) {
      const relativePath = urlStr.slice(SUPABASE_URL.length);
      const proxiedUrl = `/api/supabase${relativePath}`;
      return fetch(proxiedUrl, init);
    }
  }
  return fetch(input, init);
};

export const supabase = createClient(SUPABASE_URL, CLIENT_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: proxyFetch,
  },
});
