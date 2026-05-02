import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // nonce 生成（リクエストごとにユニーク）
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV !== 'production';

  // 本番: strict-dynamic + nonce (unsafe-eval なし)
  // 開発: unsafe-eval を維持（HMR/dev tools 用）
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  // nonce をリクエストヘッダーに追加（layout.tsx で読み取り可能）
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // CSP をレスポンスヘッダーに設定
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    // 静的アセット・SW・オフラインページはスキップ
    '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|offline\\.html|manifest\\.json|icons).*)',
  ],
};
