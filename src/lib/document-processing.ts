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
  return value.replace(/\s+/g, " ").trim();
}

export function buildSummary(text: string, maxSentences = 3) {
  const cleaned = normalizeWhitespace(text);

  if (!cleaned) {
    return "No readable text was extracted from this document.";
  }

  const sentences = cleaned
    .split(sentenceDelimiter)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return cleaned.slice(0, 280);
  }

  return sentences.slice(0, maxSentences).join(" ");
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
