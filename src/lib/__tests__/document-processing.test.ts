import { describe, it, expect } from "vitest";
import {
  normalizeWhitespace,
  buildSummary,
  buildHighlights,
} from "../document-processing";

describe("document-processing", () => {
  it("normalizeWhitespace collapses spaces and trims", () => {
    expect(normalizeWhitespace("  hello   world\n\t test ")).toBe(
      "hello world test",
    );
  });

  it("buildSummary returns placeholder for empty text", () => {
    expect(buildSummary("")).toContain("No readable text");
  });

  it("buildSummary returns first sentences up to max", () => {
    const text = "First sentence. Second sentence! Third sentence? Fourth.";
    expect(buildSummary(text, 2)).toBe("First sentence. Second sentence!");
  });

  it("buildHighlights prefers paragraphs longer than 40 chars", () => {
    const text =
      "Short.\n\nThis is a long paragraph that should be picked as a highlight because it has many words and more than forty characters.\n\nAnother long paragraph here that is also valid.";
    const highlights = buildHighlights(text, 2);
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0].length).toBeGreaterThan(40);
  });
});
