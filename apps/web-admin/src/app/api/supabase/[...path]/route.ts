import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_TARGET = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ayfgfvhqwacxsjqbyfjm.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

async function handler(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const targetPath = '/' + (path || []).join('/');
    const search = req.nextUrl.search;
    const targetUrl = `${SUPABASE_TARGET}${targetPath}${search}`;

    const headers = new Headers();
    headers.set('apikey', SERVICE_KEY);
    headers.set('Authorization', `Bearer ${SERVICE_KEY}`);
    headers.set('User-Agent', 'Kalansso-Server/1.0 (NodeJS)');

    // Transmettre les en-têtes nécessaires
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    const prefer = req.headers.get('prefer');
    if (prefer) headers.set('prefer', prefer);

    const range = req.headers.get('range');
    if (range) headers.set('range', range);

    const accept = req.headers.get('accept');
    if (accept) headers.set('accept', accept);

    let body: any = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await req.arrayBuffer();
      } catch {}
    }

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: 'no-store',
    });

    const hasNoBody = [204, 205, 304].includes(upstreamRes.status);
    const resBody = hasNoBody ? null : await upstreamRes.arrayBuffer();

    const resHeaders = new Headers();
    upstreamRes.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) {
        resHeaders.set(key, val);
      }
    });

    return new NextResponse(resBody, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error('Supabase Proxy Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Proxy Error' },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
