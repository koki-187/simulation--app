export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'MAS - My Agent Simuration',
    timestamp: new Date().toISOString(),
  });
}
