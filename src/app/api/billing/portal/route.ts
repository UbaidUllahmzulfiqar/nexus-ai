import { NextResponse } from 'next/server';
import type { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../../lib/authOptions';
import { resolveDashboardContext } from '../../../../lib/dashboard-context';
import { getStripeClient } from '../../../../lib/stripe';
import { getWorkspaceBilling } from '../../../../lib/billing';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json({ ok: false, error: 'Billing is not configured.' }, { status: 501 });
  }

  const context = await resolveDashboardContext(session.user.email);
  const workspace = await getWorkspaceBilling(context.workspaceId);

  if (!workspace?.stripeCustomerId) {
    return NextResponse.json(
      { ok: false, error: 'No Stripe customer is linked to this workspace.' },
      { status: 404 }
    );
  }

  const returnUrl =
    process.env.STRIPE_PORTAL_RETURN_URL ?? `${new URL(request.url).origin}/pricing`;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: returnUrl,
  });

  return NextResponse.redirect(portalSession.url, 303);
}
