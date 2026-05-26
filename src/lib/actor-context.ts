import { normalizeWhitespace } from './document-processing';
import { prisma } from './prisma';
import { verifyToken } from './auth';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const DEFAULT_USER_EMAIL = process.env.DEFAULT_APP_USER_EMAIL ?? 'owner@nexus.local';
const DEFAULT_WORKSPACE_SLUG = process.env.DEFAULT_WORKSPACE_SLUG ?? 'default-workspace';
const DEFAULT_WORKSPACE_NAME = process.env.DEFAULT_WORKSPACE_NAME ?? 'Nexus Workspace';

const INTERNAL_AUTH_SECRET = process.env.INTERNAL_AUTH_SECRET ?? '';
const ALLOW_DEV_BOOTSTRAP =
  process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_BOOTSTRAP_CONTEXT !== 'false';

export class ActorContextError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ActorContext = {
  userId: string;
  userEmail: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};

function toSafeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function resolveRequestedContext(request: Request) {
  // 1) NextAuth token (preferred)
  try {
    const token = await getToken({
      req: request as unknown as NextRequest,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (token && typeof token === 'object') {
      const requestedEmail = normalizeWhitespace(String(token['email'] ?? '')).toLowerCase();
      if (requestedEmail) {
        return {
          userEmail: requestedEmail,
          workspaceSlug: toSafeSlug(DEFAULT_WORKSPACE_SLUG),
          workspaceName: DEFAULT_WORKSPACE_NAME,
          isDefaultContext: false,
        };
      }
    }
  } catch {
    // ignore and fall back
  }

  // 2) Bearer JWT token (legacy/dev)
  const auth = request.headers.get('authorization') ?? '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    const payload = verifyToken(token);
    if (payload && typeof payload === 'object') {
      const requestedEmail = normalizeWhitespace(String(payload['email'] ?? '')).toLowerCase();
      const requestedSlug = toSafeSlug(String(payload['workspaceSlug'] ?? ''));
      if (requestedEmail && requestedSlug) {
        return {
          userEmail: requestedEmail,
          workspaceSlug: requestedSlug,
          workspaceName: String(payload['workspaceName'] ?? DEFAULT_WORKSPACE_NAME),
          isDefaultContext: false,
        };
      }
    }
  }

  // 3) Trusted internal header fallback
  const hasTrustedSecret =
    INTERNAL_AUTH_SECRET.length > 0 &&
    request.headers.get('x-internal-auth') === INTERNAL_AUTH_SECRET;

  const requestedEmail = normalizeWhitespace(
    request.headers.get('x-user-email') ?? ''
  ).toLowerCase();
  const requestedSlug = toSafeSlug(
    normalizeWhitespace(request.headers.get('x-workspace-slug') ?? '')
  );

  if (hasTrustedSecret && requestedEmail && requestedSlug) {
    return {
      userEmail: requestedEmail,
      workspaceSlug: requestedSlug,
      workspaceName: DEFAULT_WORKSPACE_NAME,
      isDefaultContext: false,
    };
  }

  // 4) Default (dev bootstrap candidate)
  return {
    userEmail: DEFAULT_USER_EMAIL.toLowerCase(),
    workspaceSlug: toSafeSlug(DEFAULT_WORKSPACE_SLUG) || 'default-workspace',
    workspaceName: DEFAULT_WORKSPACE_NAME,
    isDefaultContext: true,
  };
}

async function ensureDevBootstrapContext(
  userEmail: string,
  workspaceSlug: string,
  workspaceName: string
) {
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      name: 'Nexus Owner',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: workspaceSlug },
    update: {},
    create: {
      name: workspaceName,
      slug: workspaceSlug,
      ownerId: user.id,
    },
  });

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
  }
}

export async function requireActorContext(request: Request): Promise<ActorContext> {
  const requested = await resolveRequestedContext(request);

  // Enforce strict mode in production: if dev bootstrap is not allowed
  // and no trusted headers were provided, reject the request.
  if (!ALLOW_DEV_BOOTSTRAP && requested.isDefaultContext) {
    throw new ActorContextError(
      401,
      'Missing trusted auth headers; uploads require authenticated context in production.'
    );
  }

  if (ALLOW_DEV_BOOTSTRAP && requested.isDefaultContext) {
    await ensureDevBootstrapContext(
      requested.userEmail,
      requested.workspaceSlug,
      requested.workspaceName
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: requested.userEmail },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new ActorContextError(401, 'Unauthorized user context.');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: requested.workspaceSlug },
    select: { id: true, slug: true, name: true, ownerId: true },
  });

  if (!workspace) {
    throw new ActorContextError(403, 'Workspace is not available.');
  }

  if (workspace.ownerId === user.id) {
    return {
      userId: user.id,
      userEmail: user.email,
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
      workspaceName: workspace.name,
      role: 'OWNER',
    };
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new ActorContextError(403, 'Workspace membership required.');
  }

  return {
    userId: user.id,
    userEmail: user.email,
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    workspaceName: workspace.name,
    role: membership.role,
  };
}
