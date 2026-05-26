"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type UploadResult = {
  id: string;
  workspaceId: string;
  title: string;
  fileName: string;
  mimeType: string;
  pageCount: number | null;
  textLength: number;
  storedTextLength: number;
  wasTruncated: boolean;
  summary: string;
  highlights: string[];
};

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("No file selected");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusText = useMemo(() => {
    if (isSubmitting) {
      return "Processing PDF...";
    }

    if (result) {
      return "Document processed successfully.";
    }

    return "Ready to upload.";
  }, [isSubmitting, result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!selectedFile) {
      setError("Choose a PDF before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", selectedFile);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | { ok: true; document: UploadResult }
        | { ok: false; error: string };

      if (!response.ok || !payload.ok) {
        setError("error" in payload ? payload.error : "Upload failed.");
        return;
      }

      setResult(payload.document);
      setTitle("");
      setSelectedFile(null);
      setFileName("No file selected");
    } catch {
      setError("Something went wrong while processing the upload.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="page">
        <header className="nav">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            Document upload
          </div>
          <div className="nav-links">
            <span>{statusText}</span>
            <a href="/dashboard">Back to dashboard</a>
          </div>
        </header>

        <section className="section" style={{ marginTop: "1.25rem" }}>
          <div className="surface-header">
            <div>
              <h1 className="section-title">
                Process a PDF into usable workspace content
              </h1>
              <p className="section-copy">
                Upload a document to extract readable text, generate a
                deterministic summary, and preview the information that will
                later feed the AI chat and search layer.
              </p>
            </div>
            <span className="tag">PDF only</span>
          </div>

          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Document title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Quarterly roadmap"
                type="text"
              />
            </label>

            <label className="field">
              <span>PDF file</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setSelectedFile(nextFile);
                  setFileName(nextFile ? nextFile.name : "No file selected");
                }}
              />
            </label>

            <div className="upload-meta">
              <div>
                <strong>{fileName}</strong>
                <span>Maximum upload size: 15 MB</span>
              </div>
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Upload and analyze"}
              </button>
            </div>
          </form>

          {error ? <p className="error-box">{error}</p> : null}

          {result ? (
            <div className="upload-results">
              <div className="panel">
                <h3>Processed document</h3>
                <p>{result.title}</p>
                <div className="mini-grid" style={{ marginTop: "1rem" }}>
                  <div className="mini-card">
                    <strong>{result.pageCount ?? "N/A"}</strong>
                    <span>Pages</span>
                  </div>
                  <div className="mini-card">
                    <strong>{result.textLength.toLocaleString()}</strong>
                    <span>Characters extracted</span>
                  </div>
                  <div className="mini-card">
                    <strong>{result.storedTextLength.toLocaleString()}</strong>
                    <span>Characters stored</span>
                  </div>
                  <div className="mini-card">
                    <strong>{result.mimeType}</strong>
                    <span>File type</span>
                  </div>
                </div>
                {result.wasTruncated ? (
                  <p style={{ marginTop: "0.75rem" }}>
                    Stored content was truncated to save database space.
                  </p>
                ) : null}
              </div>

              <div className="panel">
                <h3>Summary</h3>
                <p>{result.summary}</p>
                <div style={{ marginTop: "1rem" }}>
                  <h3>Highlights</h3>
                  <div className="summary-list">
                    {result.highlights.map((highlight) => (
                      <div className="summary-item" key={highlight}>
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
