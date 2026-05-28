import { notFound, redirect } from 'next/navigation';
import type { DocumentStatus } from '@prisma/client';
import getServerSession from '../../../../lib/session';
import { resolveDashboardContext } from '../../../../lib/dashboard-context';
import { DocumentStatusBadge } from '../../../../components/dashboard/document-status-badge';
import Link from 'next/link';
import { DocumentChatPanel } from '../../../../components/dashboard/document-chat-panel';
import { getDocumentChatThread } from '../../../../lib/document-chat';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function formatBytes(value: number | null) {
  if (!value) return 'Unknown size';

  const megabytes = value / (1024 * 1024);
  return megabytes >= 1
    ? `${megabytes.toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

function getStatusCopy(status: DocumentStatus) {
  switch (status) {
    case 'UPLOADED':
      return 'The document has been saved and is waiting for processing.';
    case 'PROCESSING':
      return 'Extraction and summarization are running now.';
    case 'COMPLETE':
      return 'The document is fully processed and ready for review.';
    case 'FAILED':
      return 'Processing failed. Review the stored error message and retry the upload.';
  }
}

type DocumentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const context = await resolveDashboardContext(session.user.email);
  const thread = await getDocumentChatThread(context.workspaceId, id);

  if (!thread) {
    notFound();
  }

  const { document, messages } = thread;
  const isPremiumEnabled =
    process.env.NODE_ENV !== 'production' ||
    context.subscriptionStatus === 'ACTIVE' ||
    context.subscriptionStatus === 'TRIALING';

  const preview =
    document.content?.slice(0, 2000).trim() ||
    'No readable text has been stored for this document yet.';
  const summary =
    document.summary?.trim() ||
    (document.status === 'FAILED'
      ? 'This document failed before a summary could be generated.'
      : document.status === 'COMPLETE'
        ? 'A summary will appear here once processing completes.'
        : 'Summary will appear after processing completes.');

  return (
    <div className="dashboard-content-grid">
      <section className="panel dashboard-card">
        <div className="surface-header">
          <div>
            <p className="dashboard-kicker">Document details</p>
            <h2 className="section-title">{document.title}</h2>
            <p className="section-copy">{document.fileName}</p>
          </div>
          <DocumentStatusBadge status={document.status as DocumentStatus} />
        </div>

        <div className="document-meta-grid">
          <div className="mini-card">
            <strong>{document.mimeType}</strong>
            <span>Mime type</span>
          </div>
          <div className="mini-card">
            <strong>{formatBytes(document.sizeBytes)}</strong>
            <span>File size</span>
          </div>
          <div className="mini-card">
            <strong>{formatDate(document.createdAt)}</strong>
            <span>Uploaded</span>
          </div>
          <div className="mini-card">
            <strong>{formatDate(document.updatedAt)}</strong>
            <span>Last updated</span>
          </div>
        </div>
      </section>

      <section className="panel dashboard-card">
        <div className="surface-header">
          <div>
            <p className="dashboard-kicker">Processing</p>
            <h2 className="section-title">Current workflow status</h2>
          </div>
        </div>

        <div className="document-status-flow">
          <div className={`document-flow-step ${document.status === 'UPLOADED' ? 'active' : ''}`}>
            Uploaded
          </div>
          <div className={`document-flow-step ${document.status === 'PROCESSING' ? 'active' : ''}`}>
            Processing
          </div>
          <div className={`document-flow-step ${document.status === 'COMPLETE' ? 'active' : ''}`}>
            Complete
          </div>
          <div
            className={`document-flow-step ${document.status === 'FAILED' ? 'active failed' : ''}`}
          >
            Failed
          </div>
        </div>

        <p className="section-copy" style={{ marginTop: '1rem' }}>
          {getStatusCopy(document.status)}
        </p>
      </section>

      <section className="panel dashboard-card">
        <div className="surface-header">
          <div>
            <p className="dashboard-kicker">Summary</p>
            <h2 className="section-title">AI-generated summary</h2>
          </div>
        </div>

        <div className="document-summary">{summary}</div>
      </section>

      {document.status === 'FAILED' && document.processingError ? (
        <section className="panel dashboard-card error-panel">
          <div>
            <p className="dashboard-kicker">Processing failure</p>
            <h2 className="section-title">Why this document failed</h2>
          </div>
          <p className="section-copy">{document.processingError}</p>
        </section>
      ) : null}

      <section className="panel dashboard-card">
        <div className="surface-header">
          <div>
            <p className="dashboard-kicker">Content preview</p>
            <h2 className="section-title">Extracted text</h2>
          </div>
          <Link className="ghost-button" href="/dashboard/upload">
            Upload another
          </Link>
        </div>

        <div className="document-preview">{preview}</div>
      </section>

      <DocumentChatPanel
        documentId={document.id}
        documentStatus={document.status}
        isPremiumEnabled={isPremiumEnabled}
        documentTitle={document.title}
        initialMessages={messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
