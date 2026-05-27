import { prisma } from './prisma';
import { normalizeWhitespace } from './document-processing';
import { buildGroundedFallbackAnswer } from './document-chat-utils';

const MAX_CONTEXT_CHARS = 12000;
const MAX_HISTORY_MESSAGES = 6;

export type DocumentChatMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
};

export type DocumentChatThread = {
  document: {
    id: string;
    title: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number | null;
    content: string | null;
    summary: string | null;
    status: 'UPLOADED' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
    processingError: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  conversationId: string | null;
  messages: DocumentChatMessage[];
};

export async function getDocumentChatThread(workspaceId: string, documentId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      content: true,
      summary: true,
      status: true,
      processingError: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!document) {
    return null;
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      documentId,
      workspaceId,
    },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  return {
    document,
    conversationId: conversation?.id ?? null,
    messages: conversation?.messages ?? [],
  } satisfies DocumentChatThread;
}

export async function ensureDocumentConversation(params: {
  workspaceId: string;
  documentId: string;
  userId: string;
  title: string;
}) {
  const existing = await prisma.conversation.findFirst({
    where: {
      documentId: params.documentId,
      workspaceId: params.workspaceId,
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.conversation.create({
    data: {
      title: params.title,
      documentId: params.documentId,
      workspaceId: params.workspaceId,
      userId: params.userId,
    },
    select: { id: true },
  });

  return created.id;
}

function buildChatMessages(params: {
  question: string;
  documentTitle: string;
  documentText: string;
  documentSummary?: string | null;
  history: DocumentChatMessage[];
}) {
  const trimmedText = normalizeWhitespace(params.documentText).slice(0, MAX_CONTEXT_CHARS);
  const recentHistory = params.history.slice(-MAX_HISTORY_MESSAGES);

  return [
    {
      role: 'system',
      content:
        'You answer questions using only the provided document text and conversation history. If the document does not contain the answer, say so clearly. Keep responses concise, grounded, and practical.',
    },
    {
      role: 'user',
      content: [
        `Document title: ${params.documentTitle}`,
        params.documentSummary ? `Stored summary: ${params.documentSummary}` : '',
        '',
        'Extracted document text:',
        trimmedText,
        '',
        'Conversation so far:',
        ...recentHistory.map((message) => `${message.role}: ${message.content}`),
        '',
        `Question: ${params.question}`,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ];
}

async function emitTextStream(params: { text: string; onChunk: (chunk: string) => void }) {
  const chunks = params.text.match(/.{1,24}(?:\s+|$)/g) ?? [params.text];

  for (const chunk of chunks) {
    params.onChunk(chunk);
    await Promise.resolve();
  }
}

async function streamOpenAIChatCompletion(params: {
  question: string;
  documentTitle: string;
  documentText: string;
  documentSummary?: string | null;
  history: DocumentChatMessage[];
  onChunk: (chunk: string) => void;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(
    /\/$/,
    ''
  );
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.2,
        messages: buildChatMessages(params),
      }),
    });

    if (!response.ok || !response.body) {
      return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const delimiterIndex = buffer.indexOf('\n\n');

        if (delimiterIndex === -1) {
          break;
        }

        const event = buffer.slice(0, delimiterIndex);
        buffer = buffer.slice(delimiterIndex + 2);

        for (const line of event.split('\n')) {
          if (!line.startsWith('data:')) {
            continue;
          }

          const data = line.slice(5).trim();

          if (data === '[DONE]') {
            return answer;
          }

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = parsed.choices?.[0]?.delta?.content ?? '';

            if (token) {
              answer += token;
              params.onChunk(token);
            }
          } catch {
            continue;
          }
        }
      }
    }

    return answer || null;
  } catch {
    return null;
  }
}

export async function streamDocumentChatAnswer(params: {
  question: string;
  documentTitle: string;
  documentText: string;
  documentSummary?: string | null;
  history: DocumentChatMessage[];
  onChunk: (chunk: string) => void;
}) {
  const streamed = await streamOpenAIChatCompletion(params);

  if (streamed) {
    return streamed;
  }

  const fallback = buildGroundedFallbackAnswer({
    question: params.question,
    documentText: params.documentText,
    documentSummary: params.documentSummary,
  });

  await emitTextStream({ text: fallback, onChunk: params.onChunk });
  return fallback;
}
