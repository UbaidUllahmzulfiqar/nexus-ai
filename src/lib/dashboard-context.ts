import { prisma } from './prisma';

const DEFAULT_WORKSPACE_SLUG = process.env.DEFAULT_WORKSPACE_SLUG ?? 'default-workspace';
const DEFAULT_WORKSPACE_NAME = process.env.DEFAULT_WORKSPACE_NAME ?? 'Nexus Workspace';

type DashboardContext = {
  userId: string;
  userEmail: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  subscriptionTier: 'FREE' | 'PRO' | 'TEAM';
  subscriptionStatus: 'INACTIVE' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
};

export async function resolveDashboardContext(userEmail: string): Promise<DashboardContext> {
  const email = userEmail.trim().toLowerCase();

  if (!email) {
    throw new Error('Missing session email.');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  const workspace =
    (await prisma.workspace.findUnique({
      where: { slug: DEFAULT_WORKSPACE_SLUG },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerId: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    })) ??
    (await prisma.workspace.create({
      data: {
        name: DEFAULT_WORKSPACE_NAME,
        slug: DEFAULT_WORKSPACE_SLUG,
        ownerId: user.id,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerId: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    }));

  if (workspace.ownerId === user.id) {
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
      update: { role: 'OWNER' },
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });
  } else {
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'MEMBER',
      },
    });
  }

  return {
    userId: user.id,
    userEmail: user.email,
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    workspaceName: workspace.name,
    subscriptionTier: workspace.subscriptionTier,
    subscriptionStatus: workspace.subscriptionStatus,
  };
}

export async function listWorkspaceDocuments(workspaceId: string) {
  return prisma.document.findMany({
    where: { workspaceId },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getWorkspaceDocumentById(workspaceId: string, documentId: string) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
  });
}
