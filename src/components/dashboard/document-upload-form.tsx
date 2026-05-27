'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type UploadResponse =
  | {
      ok: true;
      document: {
        id: string;
        title: string;
        fileName: string;
        status: string;
        summary?: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

export function DocumentUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Ready to upload.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileLabel = useMemo(() => file?.name ?? 'No file selected', [file]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError('Choose a PDF before uploading.');
      return;
    }

    const formData = new FormData();
    formData.set('title', title);
    formData.set('file', file);

    setIsSubmitting(true);
    setStatusMessage('Uploading and processing PDF...');

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? 'Upload failed.' : payload.error);
        setStatusMessage('Upload failed.');
        return;
      }

      setStatusMessage('Document uploaded successfully.');
      setTitle('');
      setFile(null);
      router.push(`/dashboard/documents/${payload.document.id}`);
      router.refresh();
    } catch {
      setError('Something went wrong while uploading the document.');
      setStatusMessage('Upload failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel dashboard-card">
      <div className="surface-header">
        <div>
          <p className="dashboard-kicker">Upload entry</p>
          <h2 className="section-title">Upload a PDF into the workspace</h2>
          <p className="section-copy">
            Files are processed immediately, stored with metadata, and marked by status so the next
            step can attach AI features later.
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
            accept="application/pdf"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
            }}
            type="file"
          />
        </label>

        <div className="upload-meta">
          <div>
            <strong>{fileLabel}</strong>
            <span>{statusMessage}</span>
          </div>
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Upload document'}
          </button>
        </div>
      </form>

      {error ? <p className="error-box">{error}</p> : null}
    </section>
  );
}
