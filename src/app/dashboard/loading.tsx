export default function DashboardLoading() {
  return (
    <div className="dashboard-content-grid">
      <section className="panel dashboard-card skeleton-card">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line" />
        <div className="skeleton-grid">
          <div className="skeleton-tile" />
          <div className="skeleton-tile" />
          <div className="skeleton-tile" />
        </div>
      </section>
      <section className="panel dashboard-card skeleton-card">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-list">
          <div className="skeleton-item" />
          <div className="skeleton-item" />
          <div className="skeleton-item" />
        </div>
      </section>
    </div>
  );
}
