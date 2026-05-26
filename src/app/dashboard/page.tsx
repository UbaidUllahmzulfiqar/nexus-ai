const stats = [
  { label: "Workspaces", value: "4" },
  { label: "Documents", value: "18" },
  { label: "Conversations", value: "31" },
];

const activity = [
  "Summarized a board deck and saved 7 action items.",
  "Processed 3 PDF uploads into searchable chunks.",
  "Generated a workspace answer with grounded citations.",
];

export default function DashboardPage() {
  return (
    <main className="app-shell">
      <div className="page">
        <header className="nav">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            NexusAI Dashboard
          </div>
          <div className="nav-links">
            <span>Signed in as Demo User</span>
            <a href="/">Home</a>
          </div>
        </header>

        <div className="dashboard">
          <aside className="panel sidebar">
            <h3>Workspace</h3>
            <p className="section-copy">Product Launch Ops</p>
            <nav className="sidebar-nav" aria-label="Workspace navigation">
              <a className="active" href="/dashboard">
                Overview <span>12</span>
              </a>
              <span>
                Documents <span>18</span>
              </span>
              <span>
                Chats <span>31</span>
              </span>
              <span>
                Search <span>Semantic</span>
              </span>
              <span>
                Settings <span>Team</span>
              </span>
            </nav>
          </aside>

          <section className="dashboard-main">
            <div className="panel surface">
              <div className="surface-header">
                <div>
                  <h2 className="section-title">Workspace overview</h2>
                  <p className="section-copy">
                    The first implementation slice focuses on the shell, data
                    model, and AI-ready document workflow.
                  </p>
                </div>
                <a className="button" href="/dashboard/upload">
                  Upload document
                </a>
              </div>

              <div className="mini-grid">
                {stats.map((stat) => (
                  <div className="mini-card" key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel surface">
              <h3 className="section-title">Recent activity</h3>
              <div className="timeline" style={{ marginTop: "0.9rem" }}>
                {activity.map((item) => (
                  <div className="timeline-item" key={item}>
                    <span>{item}</span>
                    <span className="tag">Live</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel surface">
              <h3 className="section-title">Implementation focus</h3>
              <p className="section-copy">
                Next steps are auth, file upload, text extraction, chunking,
                embeddings, and chat over documents. This page is the product
                shell that those features will fill.
              </p>
              <p className="footer-note">
                The backend is not wired yet, so this dashboard is intentionally
                a static product scaffold for now.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
