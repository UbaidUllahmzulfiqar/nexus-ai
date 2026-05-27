export type DocumentSummary = {
  title: string;
  fileName: string;
  mimeType: string;
  pageCount: number | null;
  textLength: number;
  summary: string;
  highlights: string[];
};

const sentenceDelimiter = /(?<=[.!?])\s+/;

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function buildSummary(text: string, maxSentences = 3) {
  const cleaned = normalizeWhitespace(text);

  if (!cleaned) {
    return 'No readable text was extracted from this document.';
  }

  const sentences = cleaned
    .split(sentenceDelimiter)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return cleaned.slice(0, 280);
  }

  return sentences.slice(0, maxSentences).join(' ');
}

export function buildHighlights(text: string, maxHighlights = 4) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter((paragraph) => paragraph.length > 40)
    .slice(0, maxHighlights);

  if (paragraphs.length > 0) {
    return paragraphs;
  }

  const sentences = normalizeWhitespace(text)
    .split(sentenceDelimiter)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30)
    .slice(0, maxHighlights);

  return sentences;
}

type SummaryContext = {
  title?: string;
  fileName?: string;
};

export async function generateDocumentSummary(text: string, context: SummaryContext = {}) {
  const fallbackSummary = buildSummary(text);
  const cleanedText = normalizeWhitespace(text);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!cleanedText || !apiKey) {
    return fallbackSummary;
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
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'You write concise, grounded document summaries for a SaaS dashboard. Return 3 short sentences, no bullets, no markdown, no speculation.',
          },
          {
            role: 'user',
            content: [
              `Title: ${context.title ?? 'Untitled document'}`,
              `File name: ${context.fileName ?? 'Unknown file'}`,
              '',
              'Document text:',
              cleanedText.slice(0, 12000),
            ].join('\n'),
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallbackSummary;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const summary = normalizeWhitespace(payload.choices?.[0]?.message?.content ?? '');
    return summary || fallbackSummary;
  } catch {
    return fallbackSummary;
  }
}
