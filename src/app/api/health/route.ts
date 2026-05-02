export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'MAS - My Agent Simulation',
    timestamp: new Date().toISOString(),
  });
}
