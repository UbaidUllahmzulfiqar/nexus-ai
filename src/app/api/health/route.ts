export const runtime = 'nodejs';

export async function GET() {
  return Response.json(
    {
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
