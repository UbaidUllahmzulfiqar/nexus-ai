import { signToken } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (process.env.ALLOW_DEV_BOOTSTRAP_CONTEXT === 'false') {
    return new Response(JSON.stringify({ ok: false, error: 'Not allowed' }), { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? 'owner@nexus.local').toLowerCase();
  const workspaceSlug = String(body.workspaceSlug ?? 'default-workspace');
  const workspaceName = String(body.workspaceName ?? 'Nexus Workspace');

  const token = signToken({ email, workspaceSlug, workspaceName });

  return new Response(JSON.stringify({ ok: true, token }), { status: 200 });
}
