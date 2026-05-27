import { describe, it, expect } from 'vitest';
import {
  normalizeWhitespace,
  buildSummary,
  buildHighlights,
  generateDocumentSummary,
} from '../document-processing';
import { buildGroundedFallbackAnswer } from '../document-chat-utils';

describe('document-processing', () => {
  it('normalizeWhitespace collapses spaces and trims', () => {
    expect(normalizeWhitespace('  hello   world\n\t test ')).toBe('hello world test');
  });

  it('buildSummary returns placeholder for empty text', () => {
    expect(buildSummary('')).toContain('No readable text');
  });

  it('buildSummary returns first sentences up to max', () => {
    const text = 'First sentence. Second sentence! Third sentence? Fourth.';
    expect(buildSummary(text, 2)).toBe('First sentence. Second sentence!');
  });

  it('buildHighlights prefers paragraphs longer than 40 chars', () => {
    const text =
      'Short.\n\nThis is a long paragraph that should be picked as a highlight because it has many words and more than forty characters.\n\nAnother long paragraph here that is also valid.';
    const highlights = buildHighlights(text, 2);
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0].length).toBeGreaterThan(40);
  });

  it('generateDocumentSummary falls back when no AI key is configured', async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const summary = await generateDocumentSummary('Alpha. Beta. Gamma.', {
        title: 'Sample',
        fileName: 'sample.pdf',
      });

      expect(summary).toBe('Alpha. Beta. Gamma.');
    } finally {
      if (previous === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previous;
      }
    }
  });

  it('buildGroundedFallbackAnswer prefers document sentences relevant to the question', () => {
    const answer = buildGroundedFallbackAnswer({
      question: 'What is the launch date?',
      documentText:
        'The launch date is June 4. The team will finalize the release checklist next week. The budget remains unchanged.',
      documentSummary: null,
    });

    expect(answer.toLowerCase()).toContain('launch date');
  });
});
