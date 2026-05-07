export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'TERASS 不動産投資シミュレーター',
    timestamp: new Date().toISOString(),
  });
}
