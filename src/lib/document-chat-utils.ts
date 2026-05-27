import { normalizeWhitespace } from './document-processing';

const sentenceDelimiter = /(?<=[.!?])\s+/;

function tokenize(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);
}

function splitSentences(value: string) {
  return normalizeWhitespace(value)
    .split(sentenceDelimiter)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24);
}

export function buildGroundedFallbackAnswer(params: {
  question: string;
  documentText: string;
  documentSummary?: string | null;
}) {
  const cleanedText = normalizeWhitespace(params.documentText);

  if (!cleanedText) {
    return (
      params.documentSummary?.trim() || 'I could not find extracted text for this document yet.'
    );
  }

  const questionTokens = tokenize(params.question);
  const sentences = splitSentences(cleanedText);

  const scoredSentences = sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      const score = questionTokens.reduce(
        (accumulator, token) => accumulator + (lower.includes(token) ? 1 : 0),
        0
      );

      return { sentence, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.sentence);

  if (scoredSentences.length === 0) {
    const fallback = params.documentSummary?.trim() || sentences.slice(0, 3).join(' ');
    return fallback
      ? `Based on the document, ${fallback}`
      : 'I could not find enough grounded detail in the extracted text to answer that question.';
  }

  return `Based on the document, ${scoredSentences.join(' ')}`;
}
