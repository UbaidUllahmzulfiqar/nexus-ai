import { NextResponse } from 'next/server';
import type { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../../lib/authOptions';
import { resolveDashboardContext } from '../../../../lib/dashboard-context';
import { getStripeClient } from '../../../../lib/stripe';

export const runtime = 'nodejs';

const priceMap = {
  PRO: process.env.STRIPE_PRICE_ID_PRO ?? '',
  TEAM: process.env.STRIPE_PRICE_ID_TEAM ?? '',
} as const;

async function getBodyValue(request: Request, key: string) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return String(payload[key] ?? '');
  }

  const formData = await request.formData().catch(() => null);
  return String(formData?.get(key) ?? '');
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json({ ok: false, error: 'Billing is not configured.' }, { status: 501 });
  }

  const tier = (await getBodyValue(request, 'tier')).toUpperCase();
  const priceId = tier === 'TEAM' ? priceMap.TEAM : priceMap.PRO;

  if (!priceId) {
    return NextResponse.json(
      { ok: false, error: 'Missing Stripe price configuration.' },
      { status: 500 }
    );
  }

  const context = await resolveDashboardContext(session.user.email);
  const origin = new URL(request.url).origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: session.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?billing=success`,
    cancel_url: `${origin}/pricing?billing=cancelled`,
    client_reference_id: context.workspaceId,
    metadata: {
      workspaceId: context.workspaceId,
      userId: context.userId,
      tier,
      priceId,
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ ok: false, error: 'Unable to open checkout.' }, { status: 500 });
  }

  return NextResponse.redirect(checkoutSession.url, 303);
}
