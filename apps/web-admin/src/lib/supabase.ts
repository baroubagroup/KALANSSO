import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ayfgfvhqwacxsjqbyfjm.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// Custom fetch pour le navigateur:
// Contourne l'interdiction de Supabase Cloud sur l'en-tête User-Agent navigateur en relayant
// de façon transparente les requêtes via la route proxy locale sécurisée /api/supabase.
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

export const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: proxyFetch,
  },
});
