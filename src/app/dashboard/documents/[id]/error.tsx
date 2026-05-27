'use client';

export default function DocumentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="panel dashboard-card error-panel">
      <p className="dashboard-kicker">Document error</p>
      <h2 className="section-title">Unable to load this document</h2>
      <p className="section-copy">{error.message}</p>
      <button className="button" type="button" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
