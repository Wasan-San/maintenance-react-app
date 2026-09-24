export default function Layout({ page, onNavigate, children }) {
  const go = (target) => (event) => {
    event.preventDefault();
    onNavigate(target);
  };

  const descriptions = {
    overview: 'Track maintenance activity, categories, and cost at a glance.',
    new: 'Submit a new maintenance request.',
    database: 'View, track, and manage maintenance requests.'
  };

  return (
    <>
      <div className="background-art background-art-top" aria-hidden="true">
        <img src="/assets/workscape-bg-top.png" alt="" />
      </div>
      <div className="background-art background-art-bottom" aria-hidden="true">
        <img src="/assets/workscape-bg-bottom.png" alt="" />
      </div>

      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#overview" onClick={go('overview')} aria-label="Workscape Home">
            <img className="brand-wordmark" src="/assets/workscape-wordmark.png" alt="Workscape" />
          </a>
          <nav className="global-nav" aria-label="Main navigation">
            <a href="#">Home</a>
            <a href="#">Project</a>
            <a href="#overview" onClick={go('overview')} className="active">Maintenance</a>
            <a href="#">Operational Support</a>
            <a href="#">Event</a>
            <a href="#new" onClick={go('new')}>New Request</a>
            <a href="#">Expense</a>
          </nav>
          <div className="user">
            <div className="avatar">W</div><span>Wasan Sa.</span><span aria-hidden="true">⌄</span>
          </div>
        </div>
      </header>

      <section className="page-head shell">
        <h1>Maintenance</h1>
        <p>{descriptions[page]}</p>
        <nav className="subnav" aria-label="Maintenance navigation">
          <a href="#overview" onClick={go('overview')} className={page === 'overview' ? 'active' : ''}>Overview</a>
          <a href="#new" onClick={go('new')} className={page === 'new' ? 'active' : ''}>New Request</a>
          <a href="#database" onClick={go('database')} className={page === 'database' ? 'active' : ''}>Database</a>
        </nav>
      </section>

      {children}
    </>
  );
}
