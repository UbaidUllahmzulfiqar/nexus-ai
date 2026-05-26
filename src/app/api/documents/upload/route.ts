import { PDFParse } from "pdf-parse";

import {
  buildHighlights,
  buildSummary,
  normalizeWhitespace,
} from "../../../../lib/document-processing";
import {
  ActorContextError,
  requireActorContext,
} from "../../../../lib/actor-context";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;
const MAX_STORED_CONTENT_CHARS = Number(
  process.env.MAX_STORED_CONTENT_CHARS ?? "50000",
);

function toStoredContent(text: string) {
  const limit = Number.isFinite(MAX_STORED_CONTENT_CHARS)
    ? Math.max(1000, MAX_STORED_CONTENT_CHARS)
    : 50000;

  if (text.length <= limit) {
    return { content: text, wasTruncated: false };
  }

  return {
    content: text.slice(0, limit),
    wasTruncated: true,
  };
}

function badRequest(message: string) {
  return Response.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let actor;

  try {
    actor = await requireActorContext(request);
  } catch (error) {
    if (error instanceof ActorContextError) {
      return Response.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }

    return Response.json(
      { ok: false, error: "Unable to resolve actor context." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return badRequest("Please upload a PDF file.");
  }

  if (file.size === 0) {
    return badRequest("The uploaded file is empty.");
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return badRequest("Files must be 15 MB or smaller.");
  }

  const title =
    normalizeWhitespace(String(formData.get("title") ?? "")) || file.name;

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return badRequest("Only PDF files are supported for this flow.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = normalizeWhitespace(result.text ?? "");
    const { content, wasTruncated } = toStoredContent(text);
    const pageCount = typeof result.total === "number" ? result.total : null;
    const summary = buildSummary(text);
    const highlights = buildHighlights(result.text ?? text);

    const savedDocument = await prisma.document.create({
      data: {
        title,
        fileName: file.name,
        fileUrl: `uploads/${Date.now()}-${encodeURIComponent(file.name)}`,
        mimeType: file.type || "application/pdf",
        content,
        summary,
        status: "READY",
        sizeBytes: file.size,
        chunkCount: Math.max(1, Math.ceil(text.length / 1500)),
        ownerId: actor.userId,
        workspaceId: actor.workspaceId,
      },
    });

    return Response.json({
      ok: true,
      document: {
        id: savedDocument.id,
        workspaceId: actor.workspaceId,
        title,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        pageCount,
        textLength: text.length,
        storedTextLength: content.length,
        wasTruncated,
        summary,
        highlights,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to parse this PDF.";

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  } finally {
    await parser.destroy();
  }
}
