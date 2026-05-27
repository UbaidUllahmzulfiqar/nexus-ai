import Link from 'next/link';
import type { DocumentStatus } from '@prisma/client';
import { redirect } from 'next/navigation';
import { DocumentStatusBadge } from '../../components/dashboard/document-status-badge';
import getServerSession from '../../lib/session';
import { resolveDashboardContext, listWorkspaceDocuments } from '../../lib/dashboard-context';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function formatBytes(value: number | null) {
  if (!value) return 'Unknown size';

  const megabytes = value / (1024 * 1024);
  return megabytes >= 1
    ? `${megabytes.toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const context = await resolveDashboardContext(session.user.email);
  const documents = await listWorkspaceDocuments(context.workspaceId);

  const counts = documents.reduce(
    (accumulator, document) => {
      accumulator.total += 1;
      accumulator[document.status] += 1;
      return accumulator;
    },
    {
      total: 0,
      UPLOADED: 0,
      PROCESSING: 0,
      COMPLETE: 0,
      FAILED: 0,
    } as Record<'total' | DocumentStatus, number>
  );

  return (
    <div className="dashboard-content-grid">
      <section className="panel dashboard-card">
        <div className="surface-header">
          <div>
            <p className="dashboard-kicker">Workspace</p>
            <h2 className="section-title">{context.workspaceName}</h2>
            <p className="section-copy">
              Documents are scoped to this workspace and tied to the authenticated account that owns
              the session.
            </p>
          </div>
          <Link className="button" href="/dashboard/upload">
            Upload PDF
          </Link>
        </div>

        <div className="mini-grid dashboard-stats">
          <div className="mini-card">
            <strong>{counts.total}</strong>
            <span>Documents</span>
          </div>
          <div className="mini-card">
            <strong>{counts.PROCESSING + counts.UPLOADED}</strong>
            <span>In progress</span>
          </div>
          <div className="mini-card">
            <strong>{counts.COMPLETE}</strong>
            <span>Complete</span>
          </div>
        </div>
      </section>

      <section className="panel dashboard-card">
        <div className="surface-header">
          <div>
            <p className="dashboard-kicker">Documents</p>
            <h2 className="section-title">Workspace-scoped document list</h2>
          </div>
          <Link className="ghost-button" href="/dashboard/upload">
            Add document
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="dashboard-empty-list">
            <p>No documents yet. Upload a PDF to create the first record in this workspace.</p>
            <Link className="button" href="/dashboard/upload">
              Upload a document
            </Link>
          </div>
        ) : (
          <div className="document-list">
            {documents.map((document) => (
              <Link
                className="document-row"
                href={`/dashboard/documents/${document.id}`}
                key={document.id}
              >
                <div className="document-row-main">
                  <div>
                    <strong>{document.title}</strong>
                    <p>{document.fileName}</p>
                    {document.summary ? <p>{document.summary.slice(0, 140)}</p> : null}
                  </div>
                  <span className="document-row-meta">
                    Updated {formatDate(document.updatedAt)}
                  </span>
                </div>
                <div className="document-row-footer">
                  <DocumentStatusBadge status={document.status} />
                  <span>{formatBytes(document.sizeBytes)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
