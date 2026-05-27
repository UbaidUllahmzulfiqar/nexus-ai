import { NextResponse } from 'next/server';
import type { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../../../lib/authOptions';
import { resolveDashboardContext } from '../../../../../lib/dashboard-context';
import {
  ensureDocumentConversation,
  getDocumentChatThread,
  streamDocumentChatAnswer,
} from '../../../../../lib/document-chat';
import { prisma } from '../../../../../lib/prisma';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const context = await resolveDashboardContext(session.user.email);
  const thread = await getDocumentChatThread(context.workspaceId, id);

  if (!thread) {
    return NextResponse.json({ ok: false, error: 'Document not found.' }, { status: 404 });
  }

  if (thread.document.status !== 'COMPLETE' || !thread.document.content) {
    return NextResponse.json(
      {
        ok: false,
        error: 'This document is not ready for chat yet.',
      },
      { status: 409 }
    );
  }

  const payload = (await request.json().catch(() => null)) as { question?: string } | null;

  const question = payload?.question?.trim() ?? '';

  if (!question) {
    return NextResponse.json({ ok: false, error: 'Ask a question first.' }, { status: 400 });
  }

  const conversationId = await ensureDocumentConversation({
    workspaceId: context.workspaceId,
    documentId: thread.document.id,
    userId: context.userId,
    title: thread.document.title,
  });

  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      userId: context.userId,
      role: 'USER',
      content: question,
    },
    select: { id: true, content: true },
  });

  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  const encoder = new TextEncoder();
  let assistantText = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        assistantText = await streamDocumentChatAnswer({
          question,
          documentTitle: thread.document.title,
          documentText: thread.document.content ?? '',
          documentSummary: thread.document.summary,
          history: recentMessages.filter((message) => message.id !== userMessage.id).reverse(),
          onChunk(chunk) {
            controller.enqueue(encoder.encode(chunk));
          },
        });

        if (!assistantText.trim()) {
          assistantText = 'I could not generate a grounded answer from the document.';
          controller.enqueue(encoder.encode(assistantText));
        }

        await prisma.message.create({
          data: {
            conversationId,
            role: 'ASSISTANT',
            content: assistantText,
          },
        });

        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to generate a response.';

        controller.error(new Error(message));
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
