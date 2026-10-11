import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Check,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, ExternalLink, Eye,
  Moon, Sun,
  Fingerprint, Globe2, LayoutDashboard, LockKeyhole, LogOut, Menu,
  Search, Settings2, Shield, ShieldAlert, ShieldCheck, Smartphone,
  Sparkles, Users, X, Zap
} from "lucide-react";
import "./App.css";

const STORAGE = "brandshield_react_findings_v1";
const PROFILE_KEY = "brandshield_react_profile_v1";
const sessionKey = "brandshield_react_session_v1";
const THEME_KEY = "brandshield_react_theme_v1";

const demoFindings = [
  { id: 101, brand: "NovaBank", target: "@novabank_support_help", type: "Social Profile", platform: "Instagram", risk: "High", score: 87, status: "New", reason: "Similar name and support-themed wording", date: new Date().toLocaleDateString() },
  { id: 102, brand: "ShopWorld", target: "ShopWorld Rewards Plus", type: "Mobile App", platform: "App store", publisher: "Bright Star Labs", risk: "Medium", score: 61, status: "Under Review", reason: "Similar app name; publisher not on the official list", date: new Date().toLocaleDateString() },
  { id: 103, brand: "NovaBank", target: "NovaBank Official", type: "Social Profile", platform: "Facebook", risk: "Low", score: 24, status: "Resolved", reason: "Manual review found no clear impersonation evidence", date: new Date().toLocaleDateString() }
];

const defaultProfile = {
  brandName: "BrandShield Demo Co.",
  website: "https://example.com",
  officialSocials: "@brandshielddemo, linkedin.com/company/brandshielddemo",
  officialApps: "BrandShield Secure",
  identifiers: "BrandShield, Brand Shield"
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function ThemeToggle({ theme, onToggle, compact = false }) {
  const isLight = theme === "light";
  return <button
    className={`theme-toggle ${compact ? "theme-toggle-compact" : ""}`}
    type="button"
    onClick={onToggle}
    aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
    title={isLight ? "Switch to dark theme" : "Switch to light theme"}
  >
    <span className="theme-toggle-icon">{isLight ? <Sun size={15}/> : <Moon size={15}/>}</span>
    <span className="theme-toggle-label">{isLight ? "Light" : "Dark"}</span>
  </button>;
}

function Logo({ compact = false }) {
  return <div className={`brand-mark ${compact ? "brand-mark-small" : ""}`} aria-label="BrandShield AI">
    <ShieldCheck size={compact ? 19 : 23} strokeWidth={2.3} />
  </div>;
}

function Pill({ children, tone = "blue" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function scoreRisk(score) {
  return score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
}

function normalizedName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a, b) {
  if (!a) return b.length;
  if (!b) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = old;
    }
  }
  return row[b.length];
}

function analyzeTarget({ brand, target, reason, publisher, officialValues = [] }) {
  const b = normalizedName(brand);
  const t = normalizedName(target);
  const official = officialValues.map(normalizedName).filter(Boolean);
  const isOfficial = official.some(v => v === t || (v.length > 4 && t.includes(v)));
  if (isOfficial) {
    return { score: 8, risk: "Low", note: "This target matches an item in the saved official asset list. It is excluded from suspicious findings." , excluded: true };
  }
  let score = 12;
  const details = [];
  if (reason === "name") { score += 26; details.push("brand/name similarity selected"); }
  if (reason === "scam") { score += 46; details.push("reported scam-like behavior"); }
  if (reason === "fake") { score += 32; details.push("suspicious identity selected"); }
  if (b && t) {
    if (t.includes(b) && t !== b) { score += 18; details.push("brand name appears with extra wording"); }
    const distance = levenshtein(b, t);
    if (distance > 0 && distance <= 2 && Math.min(b.length, t.length) >= 5) {
      score += 22; details.push("possible look-alike spelling");
    }
  }
  const signals = ["support", "verify", "urgent", "reward", "free", "login", "payment", "help", "official", "claim"];
  const matched = signals.filter(word => String(target).toLowerCase().includes(word));
  if (matched.length) { score += Math.min(20, matched.length * 5); details.push(`keyword signals: ${matched.join(", ")}`); }
  if (publisher && /unknown|unverified|personal/i.test(publisher)) { score += 14; details.push("publisher needs verification"); }
  score = Math.min(99, score);
  return {
    score,
    risk: scoreRisk(score),
    note: details.length ? `Review indicators: ${details.join("; ")}.` : "Few rule-based indicators were found. This is not proof of legitimacy.",
    excluded: false
  };
}

function Landing({ onGetStarted, onLogin, theme, onToggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="landing">
    <nav className="landing-nav wrap">
      <a className="wordmark" href="#top" aria-label="BrandShield home"><Logo /><span>BrandShield <b>AI</b></span></a>
      <div className={`landing-links ${mobileOpen ? "links-open" : ""}`}>
        <a href="#platform" onClick={() => setMobileOpen(false)}>Platform</a>
        <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
        <a href="#why-brandshield" onClick={() => setMobileOpen(false)}>Why BrandShield</a>
        <button className="nav-login" onClick={onLogin}>Sign in</button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} /><button className="btn btn-primary nav-cta" onClick={onGetStarted}>Open workspace <ArrowRight size={16} /></button>
      </div>
      <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
    </nav>

    <main id="top">
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-pulse" /> DIGITAL RISK PROTECTION <span className="eyebrow-line" /></div>
          <h1>Your brand deserves<br />a <span className="gradient-text">safer internet.</span></h1>
          <p className="hero-description">Spot potential impersonation across social profiles and mobile apps. Give your team one clear place to investigate, prioritize, and track brand risks.</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={onGetStarted}>Explore the platform <ArrowRight size={18} /></button>
            <a className="quiet-link" href="#how-it-works"><span className="play-icon">↘</span> See how it works</a>
          </div>
          <div className="trust-row">
            <div className="avatar-stack"><span>BS</span><span>IT</span><span>✓</span></div>
            <div><strong>One workspace. Clearer decisions.</strong><small>Built for security, brand, and trust teams.</small></div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Illustration of a brand risk monitoring dashboard">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="glow glow-blue" /><div className="glow glow-purple" />
          <div className="floating-chip chip-top"><span className="chip-dot purple" /><span><b>Social signals</b><small>Identity patterns</small></span><ArrowUpRight size={16} /></div>
          <div className="glass-dashboard">
            <div className="mock-top"><div className="mock-brand"><Logo compact /><span>Risk overview</span></div><span className="live-label"><i /> DEMO LIVE</span></div>
            <div className="mock-welcome"><div><small>BRAND MONITORING</small><h3>Threat landscape</h3></div><div className="mock-calendar"><Clock3 size={13} /> Last 7 days <ChevronDown size={13} /></div></div>
            <div className="mock-metrics">
              <div className="mock-metric"><span>Signals reviewed</span><strong>248</strong><small className="metric-up"><ArrowUpRight size={12} /> 18.4%</small><div className="sparkline"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
              <div className="mock-metric"><span>Needs review</span><strong>12</strong><small className="metric-warn"><Activity size={12} /> Prioritized</small><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
            </div>
            <div className="mock-list-title"><strong>Recent signals</strong><span>View all <ArrowUpRight size={12}/></span></div>
            <div className="mock-row"><span className="mock-icon pink"><Users size={15}/></span><div><b>Look-alike social profile</b><small>@novabank_support_help</small></div><Pill tone="high">High</Pill></div>
            <div className="mock-row"><span className="mock-icon violet"><Smartphone size={15}/></span><div><b>Unverified app publisher</b><small>ShopWorld Rewards Plus</small></div><Pill tone="medium">Review</Pill></div>
            <div className="mock-footer"><ShieldCheck size={14} /> Potential signals are reviewed by your team</div>
          </div>
          <div className="floating-chip chip-bottom"><div className="success-icon"><Check size={15}/></div><span><b>Official assets protected</b><small>Known assets are excluded</small></span></div>
          <div className="visual-caption"><span /> Visual preview uses sample data</div>
        </div>
      </section>

      <section className="trust-strip wrap">
        <span className="strip-label">DESIGNED FOR TEAMS THAT PROTECT</span>
        <div><Shield size={17}/> Brand & Communications</div><div><LockKeyhole size={17}/> Security Operations</div><div><Users size={17}/> Trust & Safety</div>
      </section>

      <section id="platform" className="section wrap">
        <div className="section-intro">
          <span className="section-kicker">THE PLATFORM</span>
          <h2>See the signals.<br/><span className="muted-gradient">Understand the risk.</span></h2>
          <p>BrandShield brings key identity clues together so your team can decide what deserves attention — without confusing a warning signal with a confirmed threat.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-social"><div className="feature-icon blue-icon"><Users size={21}/></div><span className="feature-number">01 / SOCIAL</span><h3>Social profile monitoring</h3><p>Review suspicious handles, look-alike names, fake company pages, and profiles reported for scam-like behavior.</p><div className="feature-foot"><span>Profile signals</span><ArrowUpRight size={16}/></div><div className="feature-decoration social-decoration"><div>@</div><span/><span/><span/></div></article>
          <article className="feature-card feature-app"><div className="feature-icon violet-icon"><Smartphone size={21}/></div><span className="feature-number">02 / APPS</span><h3>Mobile app monitoring</h3><p>Compare app names and publisher details against your official asset profile to surface apps that need a closer look.</p><div className="feature-foot"><span>Publisher checks</span><ArrowUpRight size={16}/></div><div className="app-decoration"><div><ShieldCheck size={22}/></div><span/><span/><span/></div></article>
          <article className="feature-card feature-brand"><div className="feature-icon green-icon"><Fingerprint size={21}/></div><span className="feature-number">03 / BRAND PROFILE</span><h3>Know what is official</h3><p>Save your brand identifiers and known social accounts or apps, then use them to reduce false alarms.</p><div className="feature-foot"><span>Official asset baseline</span><ArrowUpRight size={16}/></div><div className="brand-decoration"><ShieldCheck size={57}/><span/></div></article>
        </div>
      </section>

      <section id="how-it-works" className="workflow-section">
        <div className="wrap workflow-inner">
          <div className="section-intro left-intro"><span className="section-kicker">SIMPLE BY DESIGN</span><h2>From a signal<br/>to a <span className="gradient-text">clear next step.</span></h2><p>Make investigations understandable, repeatable, and easier to communicate across your team.</p><button className="btn btn-primary" onClick={onGetStarted}>Try the demo workspace <ArrowRight size={16}/></button></div>
          <div className="workflow-steps">
            <div className="workflow-line"/>
            <article className="workflow-step"><div className="step-icon"><Settings2 size={20}/></div><div><span>STEP 01</span><h3>Define your brand</h3><p>Add official handles, apps, and identifying names to establish a trusted baseline.</p></div><div className="step-state"><Check size={14}/></div></article>
            <article className="workflow-step"><div className="step-icon"><Search size={20}/></div><div><span>STEP 02</span><h3>Assess suspicious signals</h3><p>Enter a profile or app candidate and review name, keyword, and publisher indicators.</p></div><div className="step-state"><Activity size={14}/></div></article>
            <article className="workflow-step"><div className="step-icon"><ShieldAlert size={20}/></div><div><span>STEP 03</span><h3>Prioritize and track</h3><p>Review the explainable demo score, update investigation status, and export a report.</p></div><div className="step-state"><ArrowRight size={14}/></div></article>
          </div>
        </div>
      </section>

      <section id="why-brandshield" className="closing-section wrap">
        <div className="closing-glow"/>
        <div className="closing-shield"><ShieldCheck size={36}/></div>
        <span className="section-kicker">START WITH CLARITY</span>
        <h2>Protect trust, one signal at a time.</h2>
        <p>Open the interactive prototype and explore the monitoring workflow with sample findings.</p>
        <button className="btn btn-primary btn-large" onClick={onGetStarted}>Open BrandShield AI <ArrowRight size={18}/></button>
        <small><CircleHelp size={13}/> Prototype note: external platforms are not scanned live in this demo.</small>
      </section>
    </main>
    <footer className="landing-footer wrap"><a className="wordmark" href="#top"><Logo compact/><span>BrandShield <b>AI</b></span></a><span>Digital Risk Protection · Hackathon prototype</span><a href="#top">Back to top ↑</a></footer>
  </div>;
}

function Login({ onSuccess, onBack, theme, onToggleTheme }) {
  const [email, setEmail] = useState("team@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Enter an email and password to open the demo."); return; }
    onSuccess(email.trim());
  }
  return <div className="login-screen">
    <button className="back-link" onClick={onBack}>← Back to home</button>
    <div className="login-theme-toggle"><ThemeToggle theme={theme} onToggle={onToggleTheme} compact /></div>
    <div className="login-glow login-glow-one"/><div className="login-glow login-glow-two"/>
    <form className="login-card glass-panel" onSubmit={submit}>
      <Logo/>
      <span className="section-kicker">SECURE WORKSPACE</span>
      <h1>Welcome back.</h1><p>Sign in to your BrandShield demo workspace.</p>
      <label>Email address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="team@example.com" required/>
      <label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter any demo password" required/>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary login-submit" type="submit">Enter workspace <ArrowRight size={16}/></button>
      <div className="demo-login-note"><Sparkles size={15}/> Hackathon demo: any valid email and non-empty password works.</div>
    </form>
  </div>;
}

function Sidebar({ page, setPage, email, onLogout, mobileOpen, setMobileOpen }) {
  const items = [
    ["home", "Home", LayoutDashboard],
    ["brand", "Brand profile", ShieldCheck],
    ["social", "Social monitoring", Users],
    ["apps", "App monitoring", Smartphone],
    ["threats", "Threat intelligence", ShieldAlert],
    ["reports", "Reports", Activity]
  ];
  return <>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={()=>setMobileOpen(false)}/>}
    <aside className={`app-sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <a className="wordmark sidebar-wordmark" href="#workspace"><Logo/><span>BrandShield <b>AI</b></span></a>
      <div className="workspace-label">WORKSPACE <span>DEMO</span></div>
      <nav className="side-nav">{items.map(([id, label, Icon])=><button key={id} className={page===id?"side-link active":"side-link"} onClick={()=>{setPage(id);setMobileOpen(false)}}><Icon size={18}/><span>{label}</span>{id==="threats" && <span className="nav-count">!</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><div><CircleHelp size={17}/></div><b>Need a quick tour?</b><p>Start on Home for the demo workflow.</p><button onClick={()=>{setPage("home");setMobileOpen(false)}}>View overview <ArrowRight size={13}/></button></div>
        <div className="user-mini"><div className="user-avatar">{(email||"ST").slice(0,2).toUpperCase()}</div><div><b>Security Team</b><small>{email}</small></div><button title="Sign out" onClick={onLogout}><LogOut size={16}/></button></div>
      </div>
    </aside>
  </>;
}

function HomeWorkspace({ findings, profile, setPage }) {
  const open = findings.filter(f=>f.status!=="Resolved");
  const high = open.filter(f=>f.risk==="High").length;
  const social = findings.filter(f=>f.type==="Social Profile").length;
  const apps = findings.filter(f=>f.type==="Mobile App").length;
  const latest = [...findings].slice(-4).reverse();
  return <div className="workspace-page page-enter">
    <div className="workspace-hero">
      <div className="workspace-hero-copy"><div className="eyebrow"><span className="eyebrow-pulse"/> YOUR BRAND PROTECTION CENTER</div><h1>Good to see you.<br/><span className="gradient-text">Let’s protect your brand.</span></h1><p>Review potential impersonation signals, check suspicious social profiles or apps, and keep your team’s findings organized.</p><div className="hero-cta-row"><button className="btn btn-primary" onClick={()=>setPage("social")}>Check a social profile <ArrowRight size={16}/></button><button className="btn btn-glass" onClick={()=>setPage("apps")}>Review an app <Smartphone size={16}/></button></div></div>
      <div className="workspace-hero-art"><div className="hero-art-ring ring-a"/><div className="hero-art-ring ring-b"/><div className="hero-art-shield"><ShieldCheck size={67}/></div><div className="art-orbit-dot dot-a"/><div className="art-orbit-dot dot-b"/><div className="art-orbit-dot dot-c"/><div className="art-float-tag"><CheckCircle2 size={15}/> Official assets baseline</div></div>
    </div>
    <div className="stats-grid">
      <StatCard icon={Eye} label="Total findings" value={findings.length} note="All recorded signals" tone="blue" />
      <StatCard icon={ShieldAlert} label="High risk · open" value={high} note="Prioritize for review" tone="rose" />
      <StatCard icon={Users} label="Social profiles" value={social} note="Profiles assessed" tone="violet" />
      <StatCard icon={Smartphone} label="Mobile apps" value={apps} note="Apps assessed" tone="green" />
    </div>
    <div className="home-columns">
      <section className="content-card recent-card"><div className="card-heading"><div><span className="section-kicker">ACTIVITY</span><h2>Recent findings</h2></div><button className="subtle-link" onClick={()=>setPage("threats")}>View all <ArrowRight size={14}/></button></div>
        {latest.length ? <div className="recent-list">{latest.map(item=><div className="recent-item" key={item.id}><div className={`recent-icon ${item.type==="Mobile App"?"app-recent":"social-recent"}`}>{item.type==="Mobile App"?<Smartphone size={17}/>:<Users size={17}/>}</div><div className="recent-details"><b>{item.target}</b><small>{item.brand} · {item.type} · {item.date}</small></div><div className="recent-pills"><Pill tone={item.risk.toLowerCase()}>{item.risk}</Pill><span className="status-text">{item.status}</span></div></div>)}</div> : <EmptyState title="No findings yet" text="Use Social Monitoring or App Monitoring to assess a candidate."/>}
      </section>
      <section className="content-card quick-start-card"><div className="card-heading"><div><span className="section-kicker">GET STARTED</span><h2>Your next steps</h2></div><Sparkles size={19} className="sparkle-icon"/></div>
        <button className="next-step" onClick={()=>setPage("brand")}><span className="step-number">01</span><span><b>Set up your brand profile</b><small>Save official names, social accounts, and apps.</small></span><ArrowRight size={16}/></button>
        <button className="next-step" onClick={()=>setPage("social")}><span className="step-number">02</span><span><b>Check a social profile</b><small>Review a possible impersonation signal.</small></span><ArrowRight size={16}/></button>
        <button className="next-step" onClick={()=>setPage("apps")}><span className="step-number">03</span><span><b>Assess a mobile app</b><small>Compare app and publisher details.</small></span><ArrowRight size={16}/></button>
        <div className="profile-status"><div className="profile-status-icon"><ShieldCheck size={17}/></div><div><b>{profile.brandName || "Brand profile not configured"}</b><small>{profile.officialSocials || profile.officialApps ? "Brand profile saved · official assets used in checks" : "Add official assets to reduce false alarms"}</small></div><button onClick={()=>setPage("brand")} aria-label="Edit brand profile"><ArrowUpRight size={16}/></button></div>
      </section>
    </div>
    <div className="disclaimer-bar"><ShieldCheck size={16}/><span><b>Responsible by design:</b> scores are rule-based prototype indicators, not proof that an account or app is malicious. Verify evidence before taking action.</span></div>
  </div>;
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  return <article className="stat-card glass-panel"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><span className="stat-label">{label}</span><div className="stat-value">{value}</div><small>{note}</small><div className={`stat-glow ${tone}`}/></article>;
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><div><Search size={22}/></div><b>{title}</b><p>{text}</p></div>;
}

function BrandProfile({ profile, onSave }) {
  const [draft, setDraft] = useState(profile);
  useEffect(()=>setDraft(profile),[profile]);
  const update = (key, value) => setDraft(prev=>({...prev,[key]:value}));
  function submit(e){e.preventDefault();onSave(draft);}
  return <div className="workspace-page page-enter"><PageHeading kicker="TRUSTED BASELINE" title="Brand profile" description="Define the assets your team knows are legitimate. Exact matches can be excluded from suspicious findings."/>
    <div className="brand-profile-layout"><form className="content-card profile-form" onSubmit={submit}><div className="form-section-heading"><div className="form-symbol"><ShieldCheck size={20}/></div><div><h2>Organization identity</h2><p>Use names and assets that help distinguish your brand from look-alikes.</p></div></div>
      <label>Company or brand name<input value={draft.brandName} onChange={e=>update("brandName",e.target.value)} placeholder="e.g. Northstar Finance" required/></label>
      <label>Official website<input value={draft.website} onChange={e=>update("website",e.target.value)} placeholder="https://yourbrand.com"/></label>
      <label>Official social accounts <span className="label-hint">Separate entries with commas</span><textarea value={draft.officialSocials} onChange={e=>update("officialSocials",e.target.value)} placeholder="@yourbrand, linkedin.com/company/yourbrand" rows="3"/></label>
      <label>Official mobile app names <span className="label-hint">Separate entries with commas</span><textarea value={draft.officialApps} onChange={e=>update("officialApps",e.target.value)} placeholder="YourBrand, YourBrand Business" rows="2"/></label>
      <label>Other brand identifiers <span className="label-hint">Aliases, spacing variants, product names</span><textarea value={draft.identifiers} onChange={e=>update("identifiers",e.target.value)} placeholder="Your Brand, YourBrand Pay" rows="2"/></label>
      <button className="btn btn-primary" type="submit"><Check size={16}/> Save brand profile</button>
    </form>
    <aside className="content-card profile-preview"><span className="section-kicker">PROFILE PREVIEW</span><div className="profile-emblem"><ShieldCheck size={31}/></div><h2>{draft.brandName || "Your brand name"}</h2><p className="preview-url">{draft.website || "Add your official website"}</p><div className="baseline-status"><CheckCircle2 size={17}/><span><b>Official asset baseline</b><small>Used by local assessment rules</small></span></div><div className="preview-field"><span>Social accounts</span><b>{(draft.officialSocials||"").split(",").filter(s=>s.trim()).length} listed</b></div><div className="preview-field"><span>Official apps</span><b>{(draft.officialApps||"").split(",").filter(s=>s.trim()).length} listed</b></div><div className="preview-field"><span>Other identifiers</span><b>{(draft.identifiers||"").split(",").filter(s=>s.trim()).length} listed</b></div><div className="profile-tip"><Sparkles size={15}/><p>Tip: add official handles and app names exactly as your team recognizes them. This prototype does not verify ownership.</p></div></aside></div>
  </div>;
}

function PageHeading({ kicker, title, description, action }) {
  return <div className="page-heading"><div><span className="section-kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function MonitorPage({ kind, profile, onAdd }) {
  const isSocial = kind === "social";
  const [brand, setBrand] = useState(profile.brandName || "");
  const [platform, setPlatform] = useState("Instagram");
  const [target, setTarget] = useState("");
  const [publisher, setPublisher] = useState("");
  const [reason, setReason] = useState("name");
  const [result, setResult] = useState(null);
  useEffect(()=>setBrand(profile.brandName||""),[profile.brandName]);
  const title = isSocial ? "Social monitoring" : "App monitoring";
  function submit(e) {
    e.preventDefault();
    const officialValues = isSocial
      ? (profile.officialSocials||"").split(",").concat((profile.identifiers||"").split(","))
      : (profile.officialApps||"").split(",").concat((profile.identifiers||"").split(","));
    const analysis = analyzeTarget({brand, target, reason, publisher, officialValues});
    const item = {
      id: Date.now(), brand, target, type: isSocial ? "Social Profile" : "Mobile App",
      platform: isSocial ? platform : "App store", publisher, risk: analysis.risk,
      score: analysis.score, status: analysis.excluded ? "Resolved" : "New",
      reason: analysis.note, date: new Date().toLocaleDateString(), excluded: analysis.excluded
    };
    setResult({...analysis, item});
    if (!analysis.excluded) onAdd(item);
  }
  return <div className="workspace-page page-enter"><PageHeading kicker={isSocial?"SOCIAL & PROFILE SIGNALS":"APP STORE SIGNALS"} title={title} description={isSocial ? "Assess a profile that may be using your brand identity. Review name similarity and reported behavior." : "Review suspicious app names and publishers against the official assets saved in your brand profile."}/>
    <div className="monitor-layout"><form className="content-card monitor-form" onSubmit={submit}><div className="form-section-heading"><div className={`form-symbol ${isSocial?"social-symbol":"app-symbol"}`}>{isSocial?<Users size={20}/>:<Smartphone size={20}/>}</div><div><h2>{isSocial?"Social profile check":"Mobile app check"}</h2><p>Enter the details you want to assess.</p></div></div>
      <label>Brand name<input value={brand} onChange={e=>setBrand(e.target.value)} required placeholder="Brand name"/></label>
      {isSocial && <label>Social platform<select value={platform} onChange={e=>setPlatform(e.target.value)}><option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>X</option><option>YouTube</option><option>TikTok</option><option>Other</option></select></label>}
      <label>{isSocial?"Profile name or URL":"App name"}<input value={target} onChange={e=>setTarget(e.target.value)} required placeholder={isSocial?"@brand_support or profile URL":"e.g. Brand Secure Rewards"}/></label>
      {!isSocial && <label>Developer / publisher<input value={publisher} onChange={e=>setPublisher(e.target.value)} placeholder="Publisher shown in the store"/></label>}
      <label>Primary reason for review<select value={reason} onChange={e=>setReason(e.target.value)}><option value="name">Similar brand or look-alike name</option><option value="scam">Scam-like messages or payment claims</option><option value="fake">Suspicious or unverified identity</option><option value="none">No specific concern yet</option></select></label>
      <div className="form-info"><LockKeyhole size={15}/><span>Assessment runs locally in this prototype. It does not contact or scan external platforms.</span></div>
      <button className="btn btn-primary monitor-submit" type="submit">Assess {isSocial?"profile":"app"} <ArrowRight size={16}/></button>
    </form>
    <div className="monitor-side"><div className="content-card signal-guide"><span className="section-kicker">WHAT WE CHECK</span><h2>Signals, not assumptions.</h2><p>Use the result as a starting point for human review — not as a verdict.</p><div className="guide-item"><div className="guide-check"><Check size={14}/></div><span><b>Name similarity</b><small>Extra words, spacing, and possible spelling changes</small></span></div><div className="guide-item"><div className="guide-check"><Check size={14}/></div><span><b>Risk keywords</b><small>Support, rewards, verification, login, and payment terms</small></span></div>{!isSocial&&<div className="guide-item"><div className="guide-check"><Check size={14}/></div><span><b>Publisher context</b><small>Unfamiliar publisher details may need verification</small></span></div>}<div className="guide-note"><ShieldCheck size={17}/><span>Official assets from your Brand Profile are checked first.</span></div></div>
      {result && <div className={`assessment-result ${result.excluded?"result-safe":""}`}><div className="result-top"><div><span className="section-kicker">ASSESSMENT RESULT</span><h3>{result.excluded?"Official asset match":"Review recommended"}</h3></div><Pill tone={result.risk.toLowerCase()}>{result.risk}</Pill></div><div className="score-row"><div className="score-circle"><strong>{result.score}</strong><small>/100</small></div><div><b>{result.excluded?"Excluded from suspicious findings":`${result.risk} rule-based indicator score`}</b><p>{result.note}</p></div></div>{!result.excluded && <button className="subtle-link" onClick={()=>setResult({...result,saved:true})}><Check size={14}/> {result.saved?"Saved to Threat Intelligence":"Finding saved to Threat Intelligence"}</button>}</div>}
    </div></div>
  </div>;
}

function Threats({ findings, onUpdate, onDelete }) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All");
  const [status, setStatus] = useState("All");
  const filtered = useMemo(()=>findings.filter(f=>{
    const match = [f.brand,f.target,f.type,f.reason,f.publisher].join(" ").toLowerCase().includes(query.toLowerCase());
    return match && (risk==="All"||f.risk===risk) && (status==="All"||f.status===status);
  }),[findings,query,risk,status]);
  function exportCsv(){
    const header=["Brand","Target","Type","Platform","Publisher","Risk","Score","Status","Reason","Date"];
    const rows=filtered.map(f=>[f.brand,f.target,f.type,f.platform||"",f.publisher||"",f.risk,f.score,f.status,f.reason,f.date]);
    const cell=v=>{let s=String(v??"");if(/^[=+\-@\t\r]/.test(s))s="'"+s;return `"${s.replace(/"/g,'""')}"`;};
    const csv=[header,...rows].map(row=>row.map(cell).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
    const a=document.createElement("a");a.href=url;a.download="brandshield-findings.csv";a.click();URL.revokeObjectURL(url);
  }
  return <div className="workspace-page page-enter"><PageHeading kicker="INVESTIGATION QUEUE" title="Threat intelligence" description="Search findings, prioritize potential risk, and track each investigation." action={<button className="btn btn-primary" onClick={exportCsv}>Export CSV <ArrowDownRight size={16}/></button>}/>
    <div className="content-card threat-card"><div className="filter-row"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search brand, target, or signal..."/></div><select value={risk} onChange={e=>setRisk(e.target.value)}><option>All</option><option>High</option><option>Medium</option><option>Low</option></select><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>New</option><option>Under Review</option><option>Resolved</option></select></div>
      <div className="table-wrap"><table className="threat-table"><thead><tr><th>Brand / target</th><th>Type</th><th>Risk score</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map(f=><tr key={f.id}><td><b>{f.brand}</b><small>{f.target}</small></td><td><span className="type-cell">{f.type==="Mobile App"?<Smartphone size={15}/>:<Users size={15}/>} {f.type}</span></td><td><div className="risk-score-cell"><Pill tone={f.risk.toLowerCase()}>{f.risk}</Pill><span>{f.score}/100</span></div></td><td><select className="status-select" value={f.status} onChange={e=>onUpdate(f.id,e.target.value)}><option>New</option><option>Under Review</option><option>Resolved</option></select></td><td><button className="icon-action" title="Delete finding" onClick={()=>onDelete(f.id)}><X size={16}/></button></td></tr>)}</tbody></table>{filtered.length===0&&<EmptyState title="No matching findings" text="Try changing the filters or assess a new profile or app."/>}</div>
      <div className="table-foot"><span>Showing <b>{filtered.length}</b> of <b>{findings.length}</b> findings</span><span><span className="foot-dot"/> Local demo data</span></div>
    </div>
  </div>;
}

function Reports({ findings }) {
  const counts = { high:findings.filter(f=>f.risk==="High").length, medium:findings.filter(f=>f.risk==="Medium").length, low:findings.filter(f=>f.risk==="Low").length, resolved:findings.filter(f=>f.status==="Resolved").length };
  function exportCsv(){
    const header=["Brand","Target","Type","Risk","Score","Status","Reason","Date"];
    const rows=findings.map(f=>[f.brand,f.target,f.type,f.risk,f.score,f.status,f.reason,f.date]);
    const csv=[header,...rows].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="brandshield-report.csv";a.click();URL.revokeObjectURL(url);
  }
  return <div className="workspace-page page-enter"><PageHeading kicker="REPORTING CENTER" title="Reports" description="Summarize the current review queue and export findings for your demo or team review." action={<button className="btn btn-primary" onClick={exportCsv}>Download CSV <ArrowDownRight size={16}/></button>}/>
    <div className="report-summary-grid"><StatCard icon={Activity} label="Total findings" value={findings.length} note="Recorded signals" tone="blue"/><StatCard icon={ShieldAlert} label="High risk" value={counts.high} note="All statuses" tone="rose"/><StatCard icon={Clock3} label="Under review" value={findings.filter(f=>f.status==="Under Review").length} note="Investigation in progress" tone="violet"/><StatCard icon={CheckCircle2} label="Resolved" value={counts.resolved} note="Marked resolved" tone="green"/></div>
    <div className="content-card report-detail"><div><span className="section-kicker">RISK DISTRIBUTION</span><h2>Current findings at a glance</h2><p>These counts summarize the locally saved demo records. They are not live threat-intelligence metrics.</p></div><div className="distribution">{[["High",counts.high,"high"],["Medium",counts.medium,"medium"],["Low",counts.low,"low"]].map(([label,count,tone])=><div className="distribution-row" key={label}><div><span>{label} risk</span><b>{count}</b></div><div className="distribution-track"><span className={`distribution-fill ${tone}`} style={{width:`${findings.length?count/findings.length*100:0}%`}}/></div></div>)}</div><button className="btn btn-primary" onClick={exportCsv}>Export full report <ArrowDownRight size={16}/></button></div>
  </div>;
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [screen, setScreen] = useState(sessionStorage.getItem(sessionKey) ? "workspace" : "landing");
  const [page, setPage] = useState("home");
  const [email, setEmail] = useState(sessionStorage.getItem("brandshield_react_email")||"team@example.com");
  const [findings, setFindings] = useState(()=>readStorage(STORAGE,demoFindings));
  const [profile, setProfile] = useState(()=>readStorage(PROFILE_KEY,defaultProfile));
  const [mobileOpen,setMobileOpen] = useState(false);
  useEffect(()=>{
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  },[theme]);
  function toggleTheme(){setTheme(prev=>prev === "dark" ? "light" : "dark");}
  useEffect(()=>{localStorage.setItem(STORAGE,JSON.stringify(findings));},[findings]);
  useEffect(()=>{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));},[profile]);
  useEffect(()=>{document.title = screen==="workspace" ? `${page[0].toUpperCase()+page.slice(1)} · BrandShield AI` : "BrandShield AI — Digital Risk Protection";},[screen,page]);
  function login(value){setEmail(value);sessionStorage.setItem(sessionKey,"true");sessionStorage.setItem("brandshield_react_email",value);setScreen("workspace");setPage("home");}
  function logout(){sessionStorage.removeItem(sessionKey);sessionStorage.removeItem("brandshield_react_email");setScreen("landing");setPage("home");}
  function addFinding(item){setFindings(prev=>[...prev,item]);}
  function updateStatus(id,status){setFindings(prev=>prev.map(f=>f.id===id?{...f,status}:f));}
  function deleteFinding(id){if(window.confirm("Delete this finding from the local demo?"))setFindings(prev=>prev.filter(f=>f.id!==id));}
  if(screen==="login") return <Login onSuccess={login} onBack={()=>setScreen("landing")} theme={theme} onToggleTheme={toggleTheme}/>;
  if(screen==="landing") return <Landing onGetStarted={()=>setScreen("login")} onLogin={()=>setScreen("login")} theme={theme} onToggleTheme={toggleTheme}/>;
  const titles={home:"Home",brand:"Brand profile",social:"Social monitoring",apps:"App monitoring",threats:"Threat intelligence",reports:"Reports"};
  return <div className="workspace-shell">
    <Sidebar page={page} setPage={setPage} email={email} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
    <main className="workspace-main">
      <header className="workspace-topbar"><button className="mobile-menu workspace-mobile-menu" aria-label="Open navigation" onClick={()=>setMobileOpen(true)}><Menu/></button><div className="topbar-breadcrumb"><span>Workspace</span><span>/</span><b>{titles[page]}</b></div><div className="topbar-right"><ThemeToggle theme={theme} onToggle={toggleTheme} compact /><span className="workspace-live"><i/> Demo mode</span><button className="topbar-icon" title="Notifications"><Bell size={17}/><i/></button><div className="topbar-avatar">{email.slice(0,2).toUpperCase()}</div></div></header>
      <div className="workspace-content">
        {page==="home"&&<HomeWorkspace findings={findings} profile={profile} setPage={setPage}/>}
        {page==="brand"&&<BrandProfile profile={profile} onSave={setProfile}/>}
        {page==="social"&&<MonitorPage key="social" kind="social" profile={profile} onAdd={addFinding}/>}
        {page==="apps"&&<MonitorPage key="apps" kind="apps" profile={profile} onAdd={addFinding}/>}
        {page==="threats"&&<Threats findings={findings} onUpdate={updateStatus} onDelete={deleteFinding}/>}
        {page==="reports"&&<Reports findings={findings}/>}
        <footer className="workspace-footer"><span>© 2026 BrandShield AI · Hackathon prototype</span><span><ShieldCheck size={13}/> Built for clearer brand-risk review</span></footer>
      </div>
    </main>
  </div>;
}
