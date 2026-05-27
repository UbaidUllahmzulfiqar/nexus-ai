'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="panel dashboard-card error-panel">
      <p className="dashboard-kicker">Dashboard error</p>
      <h2 className="section-title">Something went wrong</h2>
      <p className="section-copy">{error.message}</p>
      <button className="button" type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
