import { prisma } from './prisma';

export type BillingStatus = 'INACTIVE' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
export type BillingTier = 'FREE' | 'PRO' | 'TEAM';

export function isPremiumBillingStatus(status: BillingStatus) {
  return status === 'ACTIVE' || status === 'TRIALING';
}

export async function getWorkspaceBilling(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      currentPeriodEnd: true,
    },
  });
}

export async function requirePremiumWorkspace(workspaceId: string) {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const workspace = await getWorkspaceBilling(workspaceId);

  if (!workspace) {
    return false;
  }

  return isPremiumBillingStatus(workspace.subscriptionStatus as BillingStatus);
}
