import { NextResponse } from 'next/server';

export function proxy() {
  const isDev = process.env.NODE_ENV !== 'production';

  // 本番: 'self' + 'unsafe-inline' — 静的ページは nonce を script タグに付与できないため
  //       nonce + strict-dynamic は動的レンダリングでないと機能しない
  // 開発: unsafe-eval を追加（HMR/dev tools 用）
  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'unsafe-inline'`;

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

  const response = NextResponse.next();

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
