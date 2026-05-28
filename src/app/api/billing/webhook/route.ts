import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getStripeClient } from '../../../../lib/stripe';
import { prisma } from '../../../../lib/prisma';

export const runtime = 'nodejs';

function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'trialing':
      return 'TRIALING';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
    case 'unpaid':
    default:
      return 'CANCELED';
  }
}

async function updateWorkspaceBySubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const currentPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;

  await prisma.workspace.updateMany({
    where: {
      OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }],
    },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: mapStripeStatus(subscription.status),
      subscriptionTier: priceId === process.env.STRIPE_PRICE_ID_TEAM ? 'TEAM' : 'PRO',
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
    },
  });
}

async function clearCanceledWorkspace(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await prisma.workspace.updateMany({
    where: {
      OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }],
    },
    data: {
      subscriptionStatus: 'CANCELED',
      subscriptionTier: 'FREE',
      currentPeriodEnd: null,
    },
  });
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: 'Billing webhook is not configured.' },
      { status: 501 }
    );
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ ok: false, error: 'Missing signature.' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook payload.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (typeof session.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await updateWorkspaceBySubscription(subscription);
        }

        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateWorkspaceBySubscription(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await clearCanceledWorkspace(subscription);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
