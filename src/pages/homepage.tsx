import React from 'react';

interface HomePageProps {
  onNavigate: (page: 'dashboard') => void;
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
          padding: 96px 24px 32px;
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
          max-width: 640px;
          margin: 0 auto 48px;
        }

        /* Introduction Section */
        .fp-intro {
          max-width: 720px;
          margin: 0 auto 64px;
          padding: 0 24px;
        }

        .fp-intro-card {
          background: #fff;
          border: 1px solid #E8E6E0;
          border-radius: 12px;
          padding: 32px;
          text-align: left;
        }

        .fp-intro-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.4px;
          margin-bottom: 16px;
          color: #1A1A1A;
        }

        .fp-intro-text {
          font-size: 14px;
          line-height: 1.7;
          color: #666;
          margin-bottom: 12px;
        }

        .fp-intro-text:last-child {
          margin-bottom: 0;
        }

        /* CTA Button */
        .fp-cta-section {
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px 96px;
          text-align: center;
        }

        .fp-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: #1A1A1A;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: -0.3px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .fp-cta-btn:hover {
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .fp-cta-btn svg {
          transition: transform 0.2s;
        }

        .fp-cta-btn:hover svg {
          transform: translateX(4px);
        }

        .fp-cta-helper {
          margin-top: 16px;
          font-size: 13px;
          color: #AAA;
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
          <span className="fp-badge">v0.5.0</span>
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
          FortiPrompt is an automated red-team security platform for testing AI systems against 
          prompt injection, jailbreak attempts, and adversarial attacks. Build resilient LLM 
          applications by discovering vulnerabilities before they reach production.
        </p>
      </div>

      {/* Introduction */}
      <div className="fp-intro">
        <div className="fp-intro-card">
          <h2 className="fp-intro-title">What is FortiPrompt?</h2>
          <p className="fp-intro-text">
            FortiPrompt automates security testing for AI-powered applications by generating 
            adversarial prompts and evaluating system defenses. Whether you're building a RAG 
            pipeline, chatbot, or LLM-powered API, FortiPrompt helps you identify and fix 
            vulnerabilities before attackers do.
          </p>
          <p className="fp-intro-text">
            <strong>Attack Testing:</strong> Generate sophisticated prompt injection attacks, 
            jailbreak attempts, and multi-turn chain exploits to probe your system's weaknesses.
          </p>
          <p className="fp-intro-text">
            <strong>Defense Testing:</strong> Evaluate your guardrails, system prompts, and 
            input sanitization against known attack patterns. Get actionable recommendations 
            to strengthen your defenses.
          </p>
          <p className="fp-intro-text">
            All testing happens in isolated "runs" — sandboxed environments where you can 
            configure backends, track results, and iterate on security improvements without 
            affecting production systems.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="fp-cta-section">
        <button className="fp-cta-btn" onClick={() => onNavigate('dashboard')}>
          Go to Dashboard
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 8H12M12 8L8 4M12 8L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="fp-cta-helper">
          Create your first run and start testing
        </div>
      </div>
    </div>
  );
};

export default HomePage;
