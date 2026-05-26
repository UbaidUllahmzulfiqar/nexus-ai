const features = [
  {
    title: "Workspace intelligence",
    copy: "Group documents, chats, and notes into shared spaces with clear ownership and search.",
  },
  {
    title: "Document chat",
    copy: "Ask questions about uploaded PDFs and get grounded answers with source-aware context.",
  },
  {
    title: "RAG-ready pipeline",
    copy: "Extract text, chunk content, generate embeddings, and prepare retrieval from day one.",
  },
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <div className="page">
        <header className="nav">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            NexusAI
          </div>
          <nav className="nav-links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="/dashboard">Dashboard</a>
            <a href="#roadmap">Roadmap</a>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-main">
            <div className="eyebrow">
              <span className="tag">AI SaaS</span>
              Document intelligence for modern teams
            </div>
            <h1 className="title">
              Your <span>second brain</span> for workspaces, files, and AI chat.
            </h1>
            <p className="subtitle">
              NexusAI is the startup-style workspace where users upload PDFs,
              organize projects, and ask grounded questions over their own
              knowledge base.
            </p>
            <div className="actions">
              <a className="button" href="/dashboard">
                Open dashboard
              </a>
              <a className="ghost-button" href="#features">
                See core features
              </a>
            </div>

            <div className="stat-row" aria-label="Product metrics">
              <div className="metric">
                <span className="metric-value">RAG</span>
                <span className="metric-label">Retrieval-first AI answers</span>
              </div>
              <div className="metric">
                <span className="metric-value">Team</span>
                <span className="metric-label">
                  Shared workspaces and roles
                </span>
              </div>
              <div className="metric">
                <span className="metric-value">Ship</span>
                <span className="metric-label">
                  Resume-ready product structure
                </span>
              </div>
            </div>
          </div>

          <aside className="hero-aside">
            <div className="panel">
              <h3>Active workspace</h3>
              <p>Product Launch Ops</p>
              <div className="workspace-list" style={{ marginTop: "0.9rem" }}>
                <div className="workspace-item">
                  <div>
                    <strong>Onboarding deck.pdf</strong>
                    <div className="panel-copy">Processing for embeddings</div>
                  </div>
                  <span className="tag">Processing</span>
                </div>
                <div className="workspace-item">
                  <div>
                    <strong>Q2 strategy notes</strong>
                    <div className="panel-copy">Ready for semantic search</div>
                  </div>
                  <span className="tag">Ready</span>
                </div>
              </div>
            </div>

            <div className="timeline" id="roadmap">
              <h3 className="section-title">Build order</h3>
              <div className="timeline-item">
                <span>1. Auth + workspace shell</span>
                <span className="tag">Now</span>
              </div>
              <div className="timeline-item">
                <span>2. File upload + extraction</span>
                <span className="tag">Next</span>
              </div>
              <div className="timeline-item">
                <span>3. AI chat + search</span>
                <span className="tag">Soon</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="section" id="features">
          <div className="section-header">
            <h2 className="section-title">Built like a real startup product</h2>
            <p className="section-copy">
              Start with the parts recruiters expect to see: a polished
              interface, a clear data model, and a product story that can evolve
              into a full SaaS.
            </p>
          </div>

          <div className="grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
