import React from 'react';

interface HomePageProps {
  onNavigate: (page: 'attack' | 'defense') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="home-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body, .home-page {
          font-family: 'DM Sans', sans-serif;
          background: #F7F6F3;
          color: #1A1A1A;
          min-height: 100vh;
        }

        .fp-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          height: 60px;
          background: #fff;
          border-bottom: 1px solid #E8E6E0;
        }

        .fp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fp-logo-icon {
          width: 28px;
          height: 28px;
          background: #1A1A1A;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fp-logo-icon svg {
          width: 16px;
          height: 16px;
        }

        .fp-logo-name {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .fp-logo-sub {
          font-size: 11px;
          color: #888;
          font-weight: 400;
        }

        .fp-nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .fp-nav-link {
          font-size: 13px;
          color: #666;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.15s;
        }

        .fp-nav-link:hover { color: #1A1A1A; }

        .fp-badge {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          background: #F0EDE6;
          color: #666;
          padding: 3px 8px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }

        /* Hero */
        .fp-hero {
          max-width: 860px;
          margin: 0 auto;
          padding: 96px 24px 64px;
          text-align: center;
        }

        .fp-hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #888;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .fp-hero-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22C55E;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .fp-hero h1 {
          font-size: 48px;
          font-weight: 600;
          letter-spacing: -1.5px;
          line-height: 1.1;
          color: #1A1A1A;
          margin-bottom: 16px;
        }

        .fp-hero h1 span {
          color: #888;
          font-weight: 300;
        }

        .fp-hero-desc {
          font-size: 16px;
          color: #666;
          line-height: 1.6;
          max-width: 520px;
          margin: 0 auto 56px;
        }

        /* Mode Cards */
        .fp-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px 96px;
        }

        .fp-card {
          background: #fff;
          border: 1px solid #E8E6E0;
          border-radius: 12px;
          padding: 32px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .fp-card:hover {
          border-color: #1A1A1A;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .fp-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .fp-card-icon.attack { background: #FEF2F2; }
        .fp-card-icon.defense { background: #F0FDF4; }

        .fp-card h2 {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.4px;
          margin-bottom: 8px;
        }

        .fp-card p {
          font-size: 13px;
          color: #888;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .fp-card-features {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 28px;
        }

        .fp-card-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #555;
        }

        .fp-card-feature-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #CCC;
          flex-shrink: 0;
        }

        .fp-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #1A1A1A;
        }

        .fp-card-cta svg {
          transition: transform 0.2s;
        }

        .fp-card:hover .fp-card-cta svg {
          transform: translateX(4px);
        }

        .fp-card-accent {
          position: absolute;
          top: 0;
          right: 0;
          width: 120px;
          height: 120px;
          border-radius: 0 12px 0 120px;
          opacity: 0.04;
        }

        .fp-card-accent.attack { background: #EF4444; }
        .fp-card-accent.defense { background: #22C55E; }

        /* Stats bar */
        .fp-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          padding: 24px;
          border-top: 1px solid #E8E6E0;
          background: #fff;
          margin-top: auto;
        }

        .fp-stat {
          text-align: center;
        }

        .fp-stat-val {
          font-family: 'DM Mono', monospace;
          font-size: 20px;
          font-weight: 500;
          color: #1A1A1A;
          letter-spacing: -0.5px;
        }

        .fp-stat-label {
          font-size: 11px;
          color: #AAA;
          margin-top: 2px;
          letter-spacing: 0.3px;
        }

        .fp-stat-divider {
          width: 1px;
          height: 32px;
          background: #E8E6E0;
        }
      `}</style>

      {/* Nav */}
      <nav className="fp-nav">
        <div className="fp-logo">
          <div className="fp-logo-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <div>
            <div className="fp-logo-name">FortiPrompt</div>
            <div className="fp-logo-sub">Red Team Security</div>
          </div>
        </div>
        <div className="fp-nav-right">
          <span className="fp-nav-link">Runs</span>
          <span className="fp-nav-link">Sessions</span>
          <span className="fp-nav-link">Settings</span>
          <span className="fp-badge">v0.4.1</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="fp-hero">
        <div className="fp-hero-tag">
          <span className="fp-hero-tag-dot" />
          Platform Active
        </div>
        <h1>
          Test AI systems<br />
          <span>before they're exploited.</span>
        </h1>
        <p className="fp-hero-desc">
          FortiPrompt automates red-team prompt injection testing across RAG pipelines,
          LLM APIs, and chat interfaces. Choose your mode to begin.
        </p>
      </div>

      {/* Mode Cards */}
      <div className="fp-cards">
        {/* Attack */}
        <div className="fp-card" onClick={() => onNavigate('attack')}>
          <div className="fp-card-accent attack" />
          <div className="fp-card-icon attack">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M11 8V12M11 14.5V15" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2>Attack Testing</h2>
          <p>Generate and execute adversarial prompts to probe LLM vulnerabilities across multiple attack vectors.</p>
          <div className="fp-card-features">
            {['Direct & indirect prompt injection', 'Multi-turn chain attacks', 'Jailbreak & role-play exploits', 'Automated success scoring'].map(f => (
              <div key={f} className="fp-card-feature">
                <span className="fp-card-feature-dot" />
                {f}
              </div>
            ))}
          </div>
          <div className="fp-card-cta">
            Start attacking
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="#1A1A1A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Defense */}
        <div className="fp-card" onClick={() => onNavigate('defense')}>
          <div className="fp-card-accent defense" />
          <div className="fp-card-icon defense">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 3L19 7V11C19 15.4 15.5 19.5 11 21C6.5 19.5 3 15.4 3 11V7L11 3Z" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 11L10 13L14 9" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Defense Testing</h2>
          <p>Evaluate and strengthen your system prompts, guardrails, and input sanitization against known attack patterns.</p>
          <div className="fp-card-features">
            {['Guardrail stress testing', 'System prompt hardening', 'Filter bypass evaluation', 'Defense score reporting'].map(f => (
              <div key={f} className="fp-card-feature">
                <span className="fp-card-feature-dot" />
                {f}
              </div>
            ))}
          </div>
          <div className="fp-card-cta">
            Start defending
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="#1A1A1A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="fp-stats">
        {[
          { val: '2,400+', label: 'Attack patterns' },
          null,
          { val: '12', label: 'Model backends' },
          null,
          { val: '99ms', label: 'Avg latency' },
          null,
          { val: 'SOC 2', label: 'Compliant' },
        ].map((item, i) =>
          item === null
            ? <div key={i} className="fp-stat-divider" />
            : <div key={i} className="fp-stat">
                <div className="fp-stat-val">{item.val}</div>
                <div className="fp-stat-label">{item.label}</div>
              </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;