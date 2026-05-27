import type { DocumentStatus } from '@prisma/client';

const statusLabels: Record<DocumentStatus, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  COMPLETE: 'Complete',
  FAILED: 'Failed',
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`tag document-status status-${status.toLowerCase()}`}>
      {statusLabels[status]}
    </span>
  );
}
