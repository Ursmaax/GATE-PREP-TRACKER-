/* ============================================================
   G4Gate — application logic (SPA router, auth, tools)
   ============================================================ */
(function () {
  "use strict";

  const D = window.G4_DATA;
  const SITE = D.site;

  /* ---------------- utils ---------------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const dstr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const todayStr = () => dstr(new Date());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtTime = (sec) => {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
  };
  const fmtMin = (min) => {
    min = Math.round(min);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  /* ---------------- storage ---------------- */
  const LS = {
    users() { try { return JSON.parse(localStorage.getItem("g4gate:users") || "{}"); } catch { return {}; } },
    saveUsers(u) { localStorage.setItem("g4gate:users", JSON.stringify(u)); },
    session() { return localStorage.getItem("g4gate:session") || ""; },
    setSession(u) { u ? localStorage.setItem("g4gate:session", u) : localStorage.removeItem("g4gate:session"); },
    state(u) { try { return JSON.parse(localStorage.getItem("g4gate:state:" + u) || "{}"); } catch { return {}; } },
    saveState(u, s) { localStorage.setItem("g4gate:state:" + u, JSON.stringify(s)); },
  };

  const me = () => LS.session();
  const meUser = () => (me() ? (LS.users()[me()] || null) : null);
  const getState = () => LS.state(me()) || {};
  const setState = (patch) => {
    const s = Object.assign({}, getState(), patch);
    LS.saveState(me(), s);
  };

  const AVATAR_COLORS = ["#10b981", "#8b5cf6", "#22d3ee", "#f59e0b", "#ef4444", "#38bdf8"];
  function colorFor(name) {
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  /* ---------------- derived stats ---------------- */
  function compute() {
    const st = getState();
    const sessions = st.sessions || [];
    const minutes = sessions.reduce((a, s) => a + (Number(s.minutes) || 0), 0);
    const answered = Number(st.practice?.answered) || 0;
    const correct = Number(st.practice?.correct) || 0;

    // streak
    const days = new Set(sessions.map((s) => s.date));
    let streak = 0;
    let cursor = new Date();
    if (!days.has(dstr(cursor))) cursor = addDays(cursor, -1);
    while (days.has(dstr(cursor))) { streak++; cursor = addDays(cursor, -1); }

    // syllabus progress
    let total = 0, done = 0;
    D.syllabus.forEach((sub) => sub.topics.forEach((t) => { total++; if (st.syllabus?.[t.id]) done++; }));

    const tests = st.tests || [];
    const best = tests.length ? Math.max(...tests.map((t) => (t.total ? Math.round((t.scored / t.total) * 100) : 0))) : 0;
    const avg = tests.length ? Math.round(tests.reduce((a, t) => a + (t.total ? (t.scored / t.total) * 100 : 0), 0) / tests.length) : 0;

    return { sessions, minutes, hours: minutes / 60, answered, correct, streak, total, done, tests, best, avg };
  }

  /* ---------------- toast / modal ---------------- */
  function toast(msg, kind) {
    const root = $("#toast-root");
    const el = document.createElement("div");
    el.className = "toast " + (kind || "");
    el.innerHTML = `<span>${kind === "err" ? "⚠️" : "✅"}</span><span>${esc(msg)}</span>`;
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, 2600);
  }
  function openModal(html) {
    let root = $("#modal-root");
    if (!root) { root = document.createElement("div"); root.id = "modal-root"; document.body.appendChild(root); }
    root.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><div class="modal card">${html}</div></div>`;
  }
  function closeModal() { const r = $("#modal-root"); if (r) r.innerHTML = ""; }

  /* ---------------- branding pieces ---------------- */
  const ICONS = {
    yt: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0033"/><path d="M10 9l5 3-5 3V9z" fill="#fff"/></svg>',
    wa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a14 14 0 0 1-1.5-.5c-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1-1.4-1-2.6s.6-1.9.9-2.1c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.1.1.3 0 .5s-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.1.3.7 1.1 1.4 1.8 1 .9 1.9 1.1 2.2 1.3.3.1.5.1.6-.1l.8-.9c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.6 0 .9z"/></svg>',
    mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    google: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a7.2 7.2 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>',
    bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };

  function logoHTML(size) {
    return `<span class="brand"><span class="logo-badge" style="font-size:${size || 0.82}rem">G4</span><span>Gate</span></span>`;
  }

  function footerHTML() {
    const ql = [
      ["Dashboard", "/"], ["Official Syllabus", "/syllabus"], ["Test Series", "/tests"],
      ["How to Prepare for Gate", "/prepare-for-gate"], ["Calendar", "/calendar"],
      ["Pomodoro Timer", "/timer"], ["Support the Project", "/thankyou"],
    ];
    const legal = [
      ["About Us", "/about"], ["Contact Us", "/contact"], ["Privacy Policy", "/privacy-policy"],
      ["Terms & Conditions", "/terms-and-conditions"], ["Cancellation & Refund", "/cancellation-and-refund"],
      ["Shipping & Delivery", "/shipping-and-delivery"],
    ];
    const bottom = [
      ["About", "/about"], ["Contact", "/contact"], ["Privacy Policy", "/privacy-policy"],
      ["Terms of Service", "/terms-and-conditions"], ["Refunds", "/cancellation-and-refund"],
      ["Delivery Policy", "/shipping-and-delivery"],
    ];
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col footer-brand">
            <div class="brand">${logoHTML(1)}</div>
            <p>${esc(SITE.tagline)}</p>
            <p class="creator-credit">Created by <b>${esc(SITE.creator.name)}</b> · Thanks to ${esc(SITE.creator.thanks)}</p>
          </div>
          <div class="footer-col">
            <h4>Quick Links</h4>
            ${ql.map(([l, h]) => `<a href="${h}">${l}</a>`).join("")}
          </div>
          <div class="footer-col">
            <h4>Legal &amp; Info</h4>
            ${legal.map(([l, h]) => `<a href="${h}">${l}</a>`).join("")}
          </div>
          <div class="footer-col">
            <h4>Creator</h4>
            <p class="creator-credit" style="margin-top:0">This tracker was created by <b>${esc(SITE.creator.name)}</b>, with thanks to ${esc(SITE.creator.thanks)} for the original idea.</p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${SITE.year} ${esc(SITE.creator.name)} · Thanks to ${esc(SITE.creator.thanks)}. All rights reserved.</span>
          <div class="links">${bottom.map(([l, h]) => `<a href="${h}">${l}</a>`).join("")}</div>
        </div>
      </div>
    </footer>`;
  }

  /* ---------------- auth layout ---------------- */
  function authPage(inner, opts) {
    return `
    <div class="bg-grid"></div>
    <div class="auth-page">
      <div class="auth-main">
        <div class="card auth-card">
          ${opts.back ? `<a class="link-muted" href="${opts.back}" style="font-size:.85rem;display:inline-block;margin-bottom:16px">← Back to Login</a>` : ""}
          ${opts.showBrand ? `<div class="auth-brand">${logoHTML(1)}</div>` : ""}
          ${inner}
        </div>
      </div>
      ${footerHTML()}
    </div>`;
  }

  function googleBtn(label) {
    return `<button class="btn btn-google btn-block" data-action="google-auth" data-label="${esc(label)}">${ICONS.google} ${esc(label)}</button>`;
  }
  function divider() {
    return `<div class="divider">OR</div>`;
  }

  /* ============================================================
     PAGE RENDERERS
     ============================================================ */

  /* ----- Login ----- */
  function renderLogin(next) {
    const inner = `
      <h1>Welcome Back</h1>
      <p class="sub">Log in to continue your GATE preparation.</p>
      ${googleBtn("Sign in with Google")}
      ${divider()}
      <form data-form="login">
        <div id="login-err"></div>
        <div class="field">
          <label for="login-id">Username or Email</label>
          <input class="input" id="login-id" name="login" autocomplete="username" placeholder="username or email" required>
        </div>
        <div class="field">
          <div class="field-row"><label for="login-pass">Password</label><a class="link" href="/forgot-password" style="font-size:.82rem">Forgot?</a></div>
          <input class="input" id="login-pass" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required>
        </div>
        <button class="btn btn-primary btn-block btn-lg" type="submit">Sign In</button>
      </form>
      <p class="center muted" style="margin:18px 0 0;font-size:.92rem">Don't have an account? <a class="link" href="/signup">Sign up here</a></p>`;
    return authPage(inner, { showBrand: true });
  }

  /* ----- Signup ----- */
  function renderSignup(next) {
    const inner = `
      <h1>Create Account</h1>
      <p class="sub">Join the GATE CSE Tracker.</p>
      ${googleBtn("Sign up with Google")}
      ${divider()}
      <form data-form="signup">
        <div id="signup-err"></div>
        <div class="field">
          <label for="su-name">Full Name</label>
          <input class="input" id="su-name" name="fullname" autocomplete="name" placeholder="Your full name" required>
        </div>
        <div class="field">
          <label for="su-user">Username</label>
          <input class="input" id="su-user" name="username" autocomplete="username" placeholder="username" required>
          <div class="hint">3–20 characters · letters, numbers and underscores only · no spaces</div>
        </div>
        <div class="field">
          <label for="su-email">Email Address</label>
          <input class="input" id="su-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
        </div>
        <div class="field">
          <label for="su-pass">Password</label>
          <input class="input" id="su-pass" name="password" type="password" autocomplete="new-password" placeholder="Create a password" required>
        </div>
        <button class="btn btn-primary btn-block btn-lg" type="submit">Sign Up</button>
      </form>
      <p class="center muted" style="margin:18px 0 0;font-size:.92rem">Already have an account? <a class="link" href="/login">Log in here</a></p>`;
    return authPage(inner, { showBrand: true });
  }

  /* ----- Forgot password ----- */
  function renderForgot() {
    const inner = `
      <h1>Reset Password</h1>
      <p class="sub">Enter your email and we'll send you a link to reset your password.</p>
      <form data-form="forgot">
        <div id="forgot-msg"></div>
        <div class="field">
          <label for="fp-email">Email Address</label>
          <input class="input" id="fp-email" name="email" type="email" placeholder="you@example.com" required>
        </div>
        <button class="btn btn-primary btn-block btn-lg" type="submit">Send Reset Link</button>
      </form>`;
    return authPage(inner, { back: "/login" });
  }

  /* ----- Static prose pages ----- */
  function prosePage(title, sub, date, body) {
    return `
    <div class="bg-grid"></div>
    <div style="min-height:100vh;display:flex;flex-direction:column">
      <div class="container page">
        <div class="prose">
          <a class="link-muted" href="/">← Back to Home</a>
          <div class="card" style="margin-top:16px">
            <h1>${title}</h1>
            <p class="muted" style="margin:6px 0 20px">${sub}</p>
            ${date ? `<p class="date">Last updated: ${date}</p>` : ""}
            ${body}
          </div>
        </div>
      </div>
      ${footerHTML()}
    </div>`;
  }

  const PROSE = {
    about: {
      title: "About Us", sub: "Learn more about G4Gate and our mission.", date: "",
      body: `<h2>Welcome to G4Gate</h2>
      <p>G4Gate (g4gate.com) is a dedicated platform designed to help aspirants prepare effectively and seamlessly for the GATE examination and related engineering tests. Our goal is to provide high-quality tools, trackers, and resources that streamline your preparation journey and empower you to achieve your best score.</p>
      <p>We understand the unique challenges faced by students, which is why we have built a suite of utilities tailored to optimize study schedules, analyze past trends, and keep you organized throughout the year.</p>
      <p>Our mission is to make quality education and effective preparation tools accessible to everyone in an intuitive, fast, and ad-free environment.</p>`,
    },
    contact: {
      title: "Contact Us", sub: "We are here to help and answer any questions you might have.", date: "",
      body: `<p>If you have any queries, feedback, or issues related to this platform, feel free to reach out.</p>
      <h3>Creator</h3>
      <p>This tracker was created by <b>${esc(SITE.creator.name)}</b>, with thanks to ${esc(SITE.creator.thanks)} for the original idea.</p>`,
    },
    privacy: {
      title: "Privacy Policy", sub: "How we handle and protect your data.", date: "8/21/2026",
      body: `<h2>1. Introduction</h2>
      <p>Welcome to G4Gate (g4gate.com). We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
      <h2>2. The Data We Collect About You</h2>
      <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
      <ul>
        <li><b>Identity Data</b> includes first name, last name, username or similar identifier.</li>
        <li><b>Contact Data</b> includes email address.</li>
        <li><b>Transaction Data</b> includes details about payments to and from you and other details of products and services you have purchased from us. (Note: Payment details are securely handled by our payment gateway service and are not stored on our servers).</li>
        <li><b>Technical Data</b> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
      </ul>
      <h2>3. How We Use Your Personal Data</h2>
      <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
      <ul>
        <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., providing access to our tools).</li>
        <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
        <li>Where we need to comply with a legal obligation.</li>
      </ul>
      <p>We do not sell, rent, or share your personal data with any third parties. Your data is used exclusively on the g4gate.com website to load your profile and show your own data back to you securely.</p>
      <h2>4. Data Security</h2>
      <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.</p>
      <h2>5. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please visit our <a href="/contact">Contact Page</a>.</p>`,
    },
    terms: {
      title: "Terms & Conditions", sub: "Rules and guidelines for using G4Gate.", date: "8/21/2026",
      body: `<h2>1. Acceptance of Terms</h2>
      <p>By accessing and using G4Gate (g4gate.com), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these Terms &amp; Conditions, please do not use our service.</p>
      <h2>2. Use of Services</h2>
      <p>G4Gate provides tools and trackers for exam preparation. You agree to use these services only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website.</p>
      <ul>
        <li>You must not share your account credentials with anyone else.</li>
        <li>You must not attempt to scrape, reverse engineer, or attack our infrastructure.</li>
      </ul>
      <h2>3. Intellectual Property</h2>
      <p>All content, tools, and designs provided on G4Gate are the intellectual property of G4Gate. You may not reuse, republish, or commercialize our tools without explicit written consent.</p>
      <h2>4. User Accounts</h2>
      <p>When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
      <h2>5. Free Trial and Subscriptions</h2>
      <p>We offer a 21-day free trial for new users to evaluate our platform and its premium features. After the trial period expires, you may choose to purchase a subscription to continue accessing these tools.</p>
      <h2>6. Disclaimer of Warranties</h2>
      <p>The tools and information on G4Gate are provided "as is". We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.</p>
      <h2>7. Limitation of Liability</h2>
      <p>In no event shall G4Gate or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on G4Gate's website.</p>
      <h2>8. Changes to Terms</h2>
      <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.</p>
      <h2>9. Contact Us</h2>
      <p>If you have any questions about these Terms, please visit our <a href="/contact">Contact Page</a>.</p>`,
    },
    refund: {
      title: "Cancellation & Refund Policy", sub: "Information on our policies regarding cancellations and refunds.", date: "8/21/2026",
      body: `<h2>1. Cancellation Policy</h2>
      <p>Since G4Gate offers digital products, tools, and SaaS resources, cancellations are generally not applicable in the traditional sense. However, if you have subscribed to a recurring payment plan (if applicable), you can cancel your subscription at any time from your account settings.</p>
      <p>Cancellation of a subscription will stop any future billing, but you will retain access to the platform services until the end of your current billing cycle.</p>
      <h2>2. Refund Policy</h2>
      <p>Due to the digital nature of our services and instant access upon purchase, <b>we do not offer refunds</b> for one-time purchases or active subscriptions once the payment has been successfully processed and access has been granted.</p>
      <p>We offer a 21-day free trial for new users. We encourage all users to utilize this trial period to carefully review the features, test out our tools, and ensure the service meets their needs before making a purchase.</p>
      <h2>3. Exceptions</h2>
      <p>Refunds may only be considered in the following exceptional cases:</p>
      <ul>
        <li>Duplicate transactions caused by a technical glitch on our platform or the payment gateway.</li>
        <li>Failure to deliver the digital service or grant access to the account, which our support team is unable to resolve within 7 days of the transaction.</li>
      </ul>
      <h2>4. Process for Requesting a Refund</h2>
      <p>If your case falls under the exceptions above, please contact us within 7 days of the transaction date with your payment receipt and transaction ID. We will review your request and process approved refunds back to the original method of payment within 5-7 business days.</p>`,
    },
    shipping: {
      title: "Shipping & Delivery Policy", sub: "Delivery details for our digital products and subscriptions.", date: "8/21/2026",
      body: `<h2>1. Digital Products Only</h2>
      <p>G4Gate (g4gate.com) is a platform offering digital services, SaaS tools, and educational resources. <b>We do not sell or ship any physical goods or products.</b> Therefore, traditional shipping and delivery terms do not apply to our platform.</p>
      <h2>2. Instant Delivery &amp; Access</h2>
      <p>Upon successful payment for any premium subscription, digital product, or service on G4Gate:</p>
      <ul>
        <li>Your account will be instantly upgraded to reflect your new access level.</li>
        <li>Digital resources, tools, or dashboard features will become immediately available upon login.</li>
        <li>You will receive an automated email confirmation of your purchase with details of the transaction.</li>
      </ul>
      <h2>3. Access Issues or Delays</h2>
      <p>In rare cases, there might be a slight delay in upgrading your account due to payment gateway processing times. If you have completed a payment but your digital access is not active within 15-30 minutes, please contact our support team immediately with your transaction ID.</p>
      <p>Contact our support team with your transaction ID, and we will manually verify and activate your services without delay.</p>`,
    },
  };

  /* ============================================================
     APP SHELL (authenticated)
     ============================================================ */
  function appShell(contentHTML, active) {
    const u = meUser();
    const unread = notifyList().length;
    const NAV_ICONS = {
      "/": "🏠", "/syllabus": "📚", "/timer": "⏱️", "/tests": "📝",
      "/calendar": "📅", "/leaderboard": "🏆", "/plans": "💳", "/notes": "🗒️",
      "/todos": "✅", "/doubts": "❓", "/pyq": "🔎", "/practice": "⚔️",
      "/teachers": "👨‍🏫", "/prepare-for-gate": "🧭", "/share": "🔗", "/profile": "👤",
    };
    const TITLE = {
      "/": "Dashboard", "/syllabus": "Syllabus Tracker", "/timer": "Pomodoro Timer",
      "/tests": "Test Series", "/calendar": "Calendar", "/leaderboard": "Leaderboard",
      "/plans": "Pricing Plans", "/notes": "Notes", "/todos": "To-do List",
      "/doubts": "Concepts & Doubts", "/pyq": "GATE PYQ Find", "/practice": "Practice Arena",
      "/teachers": "Konsa Teacher", "/prepare-for-gate": "How to Prepare", "/share": "Text & Link Share", "/profile": "Profile",
    };
    const mainItems = [
      ["/", "Dashboard"], ["/syllabus", "Syllabus"], ["/timer", "Timer"],
      ["/tests", "Tests"], ["/calendar", "Calendar"], ["/leaderboard", "Leaderboard"],
    ];
    const toolItems = [
      ["/notes", "Notes"], ["/todos", "To-dos"], ["/doubts", "Doubts"],
      ["/practice", "Practice"], ["/pyq", "PYQ Find"], ["/teachers", "Konsa Teacher"],
      ["/prepare-for-gate", "Prepare"], ["/share", "Share"],
    ];
    const sideLink = (href, label) =>
      `<a class="side-link ${active === href ? "active" : ""}" href="${href}"><span class="ic">${NAV_ICONS[href] || "•"}</span><span>${label}</span></a>`;
    const mainNav = mainItems.map(([h, l]) => sideLink(h, l)).join("");
    const toolNav = toolItems.map(([h, l]) => sideLink(h, l)).join("");
    const trial = trialActive();

    return `
    <div class="bg-grid"></div>
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="side-brand">${logoHTML(0.85)}</div>
        <div class="side-section">
          <div class="side-title">Main</div>
          ${mainNav}
        </div>
        <div class="side-section">
          <div class="side-title">Tools</div>
          ${toolNav}
        </div>
        <div class="side-spacer"></div>
        ${trial ? "" : `
        <div class="pro-card">
          <div class="t">⚡ Go Pro</div>
          <div class="p">Unlock every tool — from ₹29/month or ₹129 till GATE ${SITE.gateYear}.</div>
          <a class="btn btn-primary btn-sm btn-block" href="/plans">Upgrade →</a>
        </div>`}
        <div class="nav-more-wrap" data-wrap>
          <div class="side-user" data-action="dropdown-toggle" data-target="side-user-menu">
            <span class="avatar ${u.google ? "avatar-google" : ""}" style="${u.google ? "" : "background:" + colorFor(u.username)}">${esc((u.name || u.username)[0].toUpperCase())}</span>
            <div class="grow" style="min-width:0">
              <div style="font-weight:700;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(u.name.split(" ")[0])}</div>
              <div style="font-size:.72rem;color:var(--muted-2)">@${esc(u.username)}</div>
            </div>
            <span style="font-size:.7rem;color:var(--muted)">▾</span>
          </div>
          <div class="dropdown" id="side-user-menu" style="left:0;right:auto;bottom:calc(100% + 8px);top:auto">
            <a href="/profile">👤 Profile</a>
            <a href="/share">🔗 Text &amp; Link Share</a>
            <a href="/thankyou">💚 Support the Project</a>
            <div class="sep"></div>
            <a href="#" data-action="logout">🚪 Log out</a>
          </div>
        </div>
      </aside>
      <div class="scrim" id="scrim" data-action="sidebar-close"></div>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn hamburger" data-action="sidebar-toggle" aria-label="Menu">☰</button>
          <div class="crumb grow">G4Gate <span style="color:var(--muted-2)">/</span> <b>${TITLE[active] || "Dashboard"}</b></div>
          <div class="nav-more-wrap grow" style="max-width:320px" data-wrap>
            <div class="search-box">🔍 <input id="global-search" type="text" placeholder="Search tools, notes, subjects…" autocomplete="off"></div>
            <div class="dropdown" id="search-results" style="left:0;right:0;top:calc(100% + 6px)"></div>
          </div>
          <div class="nav-more-wrap" data-wrap>
            <button class="icon-btn" data-action="dropdown-toggle" data-target="bell-menu" aria-label="Notifications">${ICONS.bell}${unread ? `<span class="dot-badge"></span>` : ""}</button>
            <div class="dropdown" id="bell-menu" style="min-width:320px">${renderNotifications()}</div>
          </div>
          <div class="nav-more-wrap" data-wrap>
            <div class="side-user" data-action="dropdown-toggle" data-target="top-user-menu" style="border:none;background:transparent;padding:4px">
              <span class="avatar ${u.google ? "avatar-google" : ""}" style="${u.google ? "" : "background:" + colorFor(u.username)}">${esc((u.name || u.username)[0].toUpperCase())}</span>
              <span style="font-size:.7rem;color:var(--muted)">▾</span>
            </div>
            <div class="dropdown" id="top-user-menu">
              <a href="/profile">👤 Profile</a>
              <a href="/thankyou">💚 Support the Project</a>
              <div class="sep"></div>
              <a href="#" data-action="logout">🚪 Log out</a>
            </div>
          </div>
        </header>
        <div class="content">${contentHTML}</div>
        ${footerHTML()}
      </div>
    </div>`;
  }

  function notifyList() {
    const st = getState();
    const seen = st.notifSeen || {};
    const list = [
      { id: "welcome", icon: "👋", text: `Welcome to G4Gate, ${esc(meUser().name.split(" ")[0])}! Start your 21-day free trial and track your GATE ${SITE.gateYear} preparation.`, when: "Today" },
      { id: "countdown", icon: "⏳", text: `GATE ${SITE.gateYear} is ${daysToExam()} days away. Stay consistent!`, when: "Today" },
      { id: "pyq", icon: "🔎", text: "New PYQ-style practice set added to the Practice Arena.", when: "2d ago" },
      { id: "streak", icon: "🔥", text: "Log a study session today to keep your streak alive.", when: "3d ago" },
    ];
    const unread = list.filter((n) => !seen[n.id]);
    return unread.length;
  }
  function renderNotifications() {
    const st = getState();
    const seen = st.notifSeen || {};
    const list = [
      { id: "welcome", icon: "👋", text: `Welcome to G4Gate, ${esc(meUser().name.split(" ")[0])}! Start your 21-day free trial and track your GATE ${SITE.gateYear} preparation.`, when: "Today" },
      { id: "countdown", icon: "⏳", text: `GATE ${SITE.gateYear} is ${daysToExam()} days away. Stay consistent!`, when: "Today" },
      { id: "pyq", icon: "🔎", text: "New PYQ-style practice set added to the Practice Arena.", when: "2d ago" },
      { id: "streak", icon: "🔥", text: "Log a study session today to keep your streak alive.", when: "3d ago" },
    ];
    if (!list.length) return `<div class="muted" style="padding:14px">No notifications</div>`;
    return list.map((n) => `
      <div style="display:flex;gap:10px;padding:10px 12px;${seen[n.id] ? "" : "background:var(--accent-soft);border-radius:9px"}">
        <span>${n.icon}</span>
        <div><div style="font-size:.86rem;line-height:1.4">${n.text}</div><div style="font-size:.72rem;color:var(--muted-2);margin-top:2px">${n.when}</div></div>
      </div>`).join("");
  }

  function daysToExam() {
    const target = new Date(SITE.examDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((target - now) / 86400000));
  }

  /* ----- Dashboard ----- */
  function renderDashboard() {
    const u = meUser();
    const st = compute();
    const trial = trialActive();
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const tools = D.tools.map((t) => `<a class="tool" href="${t.href}"><div class="ic">${t.icon}</div><div class="t">${t.label}</div><div class="d">${t.desc}</div></a>`).join("");

    // heatmap (last 120 days)
    let heat = "";
    const dayMap = {};
    (st.sessions).forEach((s) => { dayMap[s.date] = (dayMap[s.date] || 0) + (Number(s.minutes) || 0); });
    for (let i = 119; i >= 0; i--) {
      const d = dstr(addDays(new Date(), -i));
      const m = dayMap[d] || 0;
      let lv = "";
      if (m > 0 && m < 60) lv = "l1";
      else if (m < 180) lv = "l2";
      else if (m < 300) lv = "l3";
      else if (m >= 300) lv = "l4";
      heat += `<div class="day ${lv}" title="${d} · ${m}m"></div>`;
    }

    // growth tree (last 8 weeks)
    let tree = "";
    let maxW = 1;
    const weeks = [];
    for (let w = 7; w >= 0; w--) {
      const end = addDays(new Date(), -w * 7);
      const start = addDays(end, -6);
      let m = 0;
      (st.sessions).forEach((s) => { if (s.date >= dstr(start) && s.date <= dstr(end)) m += Number(s.minutes) || 0; });
      weeks.push(m); maxW = Math.max(maxW, m);
    }
    tree = weeks.map((m, i) => `<div class="bar ${i === 7 ? "lit" : ""}" style="height:${Math.max(4, (m / maxW) * 100)}%"><span>W${i + 1}</span></div>`).join("");

    const recent = (st.sessions).slice(-5).reverse().map((s) => `
      <div class="session"><span class="dot"></span>
        <div class="grow"><div style="font-weight:600;font-size:.9rem">${esc(s.subject)}</div><div style="font-size:.78rem;color:var(--muted-2)">${s.date}</div></div>
        <span class="muted">${fmtMin(s.minutes)}</span></div>`).join("");

    const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
    const donutC = 2 * Math.PI * 48;
    const donutOff = donutC * (1 - pct / 100);

    return appShell(`
      <section class="hero mb-3">
        <div>
          <div class="eyebrow">GATE ${SITE.gateYear} · ${daysToExam()} days to go</div>
          <h1 style="margin-top:10px">${greet}, ${esc(u.name.split(" ")[0])} 👋</h1>
          <p class="muted" style="margin-top:8px">${trial ? '<span class="pill pill-green">✦ 21-day Pro trial active</span> ' : ""}Stay consistent, track your progress, and get where you're going.</p>
          <div class="row" style="gap:10px;margin-top:18px;flex-wrap:wrap">
            <a class="btn btn-primary btn-lg" href="/timer">▶ Start a Focus Session</a>
            <a class="btn btn-ghost btn-lg" href="/syllabus">📚 Open Syllabus</a>
          </div>
        </div>
        <div class="countdown" id="countdown">
          <div class="cd-unit"><div class="n" data-c="d">–</div><div class="l">Days</div></div>
          <div class="cd-unit"><div class="n" data-c="h">–</div><div class="l">Hrs</div></div>
          <div class="cd-unit"><div class="n" data-c="m">–</div><div class="l">Min</div></div>
          <div class="cd-unit"><div class="n" data-c="s">–</div><div class="l">Sec</div></div>
        </div>
      </section>

      <div class="stats-grid mb-3">
        <div class="stat acc">
          <div class="k"><span class="ic">⏱️</span> Study Hours</div>
          <div class="v" data-count="${st.hours.toFixed(1)}" data-decimals="1">${st.hours.toFixed(1)}</div>
          <div class="s">${st.sessions.length} sessions logged</div>
        </div>
        <div class="stat">
          <div class="k"><span class="ic">🧩</span> Questions Solved</div>
          <div class="v" data-count="${st.answered}">${st.answered}</div>
          <div class="s">${st.correct} correct</div>
        </div>
        <div class="stat">
          <div class="k"><span class="ic">🔥</span> Day Streak</div>
          <div class="v" data-count="${st.streak}">${st.streak}</div>
          <div class="s">${st.streak ? "keep it alive!" : "log a session today"}</div>
        </div>
        <div class="stat">
          <div class="k"><span class="ic">🎯</span> Syllabus</div>
          <div class="donut-wrap" style="margin-top:8px">
            <svg class="donut" width="68" height="68" viewBox="0 0 106 106">
              <defs><linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
              <circle class="track" cx="53" cy="53" r="48"></circle>
              <circle class="val" cx="53" cy="53" r="48" stroke-dasharray="${donutC}" stroke-dashoffset="${donutOff}"></circle>
            </svg>
            <div><div class="v" data-count="${pct}" data-suffix="%" style="font-size:1.35rem;margin-top:0">${pct}%</div><div class="s" style="margin-top:0">${st.done}/${st.total} topics</div></div>
          </div>
        </div>
      </div>

      <div class="row mb-2" style="justify-content:space-between"><h3>All Tools</h3><a class="link" href="/plans">See what's included →</a></div>
      <div class="tool-grid mb-3">${tools}</div>

      <div class="grid-2 mb-3">
        <div class="card card-hover">
          <h3 class="mb-2">📆 Study Heatmap <span class="muted" style="font-weight:500;font-size:.8rem">· last 120 days</span></h3>
          <div class="heatmap">${heat}</div>
          <div class="heat-legend">Less <span class="day"></span><span class="day l1"></span><span class="day l2"></span><span class="day l3"></span><span class="day l4"></span> More</div>
        </div>
        <div class="card card-hover">
          <h3 class="mb-2">🌱 Growth Tree <span class="muted" style="font-weight:500;font-size:.8rem">· last 8 weeks</span></h3>
          <div class="tree">${tree}</div>
        </div>
      </div>

      <div class="card">
        <div class="row mb-2"><h3>🕑 Recent Sessions</h3><a class="link" href="/timer">Open timer →</a></div>
        ${recent || `<div class="empty"><span class="ic">⏱️</span>No sessions yet — start your first focus session!</div>`}
      </div>`);
  }

  /* ----- Timer ----- */
  const Timer = {
    total: 25 * 60, remaining: 25 * 60, running: false, subject: "Data Structures", interval: null, mode: "Focus",
    start() {
      if (this.remaining <= 0) this.reset();
      this.running = true;
      this.interval = setInterval(() => this.tick(), 1000);
      this.updateDom();
    },
    pause() { this.running = false; clearInterval(this.interval); this.interval = null; this.updateDom(); },
    tick() {
      this.remaining--;
      if (this.remaining <= 0) { this.complete(); return; }
      this.updateDom();
    },
    complete() {
      this.pause();
      this.log(Math.round(this.total / 60));
      beep();
      confetti();
      toast(`Focus session complete — ${fmtMin(this.total / 60)} logged for ${this.subject}!`);
    },
    reset() { this.pause(); this.remaining = this.total; this.updateDom(); },
    setPreset(sec, label) {
      this.pause(); this.total = sec; this.remaining = sec;
      if (label) this.mode = label; else this.mode = sec >= 3600 ? "Focus" : "Pomodoro";
      this.updateDom();
    },
    log(minutes) {
      if (minutes < 1) return;
      const st = getState();
      st.sessions = st.sessions || [];
      st.sessions.push({ id: uid(), subject: this.subject, minutes, date: todayStr(), at: Date.now() });
      setState({ sessions: st.sessions });
      if (window.__onTimerLogged) window.__onTimerLogged();
    },
    updateDom() {
      const el = $("#timer-time");
      if (!el) return;
      el.textContent = fmtTime(this.remaining);
      const mode = $("#timer-mode"); if (mode) mode.textContent = this.mode;
      const btn = $("#timer-toggle"); if (btn) btn.innerHTML = this.running ? "⏸ Pause" : "▶ Start";
      const circ = 2 * Math.PI * 118;
      const prog = $("#ring-prog");
      if (prog) {
        const frac = this.total ? (this.total - this.remaining) / this.total : 0;
        prog.style.strokeDasharray = circ;
        prog.style.strokeDashoffset = circ * (1 - frac);
      }
      const subj = $("#timer-subject"); if (subj && subj.value !== this.subject) subj.value = this.subject;
    },
  };

  function subjectOptions(sel) {
    return D.syllabus.map((s) => `<option value="${esc(s.name)}" ${s.name === sel ? "selected" : ""}>${esc(s.name)}</option>`).join("");
  }

  function renderTimer() {
    const st = compute();
    const presets = [
      [25 * 60, "Pomodoro"], [50 * 60, "50 min"], [60 * 60, "1 Hour"], [120 * 60, "2 Hours"], [180 * 60, "3 Hours"],
    ];
    const today = st.sessions.filter((s) => s.date === todayStr());
    const todayMin = today.reduce((a, s) => a + s.minutes, 0);
    const recent = st.sessions.slice(-8).reverse().map((s) => `
      <div class="session"><span class="dot"></span>
        <div class="grow"><div style="font-weight:600;font-size:.9rem">${esc(s.subject)}</div><div style="font-size:.78rem;color:var(--muted-2)">${s.date}</div></div>
        <span class="muted">${fmtMin(s.minutes)}</span></div>`).join("");
    const active = presets.find((p) => p[0] === Timer.total);

    return appShell(`
      <div class="page-head"><div><h1>Pomodoro Focus Timer</h1><p>Stay in the zone — pick a subject and start a session.</p></div></div>
      <div class="timer-stage">
        <div class="card timer-card">
          <div class="field" style="max-width:280px;margin:0 auto 6px">
            <label for="timer-subject">Subject</label>
            <select class="input" id="timer-subject" data-bind="timer-subject">${subjectOptions(Timer.subject)}</select>
          </div>
          <div class="ring-wrap">
            <svg width="270" height="270" viewBox="0 0 270 270">
              <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
              <circle class="ring-track" cx="135" cy="135" r="118"></circle>
              <circle id="ring-prog" class="ring-prog" cx="135" cy="135" r="118"></circle>
            </svg>
            <div class="ring-center">
              <div class="time" id="timer-time">${fmtTime(Timer.remaining)}</div>
              <div class="mode" id="timer-mode">${Timer.mode}</div>
            </div>
          </div>
          <div class="preset-row">
            ${presets.map((p) => `<button class="preset ${active && p[0] === active[0] ? "active" : ""}" data-action="timer-preset" data-sec="${p[0]}" data-label="${p[1]}">${p[1]}</button>`).join("")}
          </div>
          <div class="timer-controls">
            <button class="btn btn-primary btn-lg" id="timer-toggle" data-action="timer-toggle">${Timer.running ? "⏸ Pause" : "▶ Start"}</button>
            <button class="btn btn-ghost btn-lg" data-action="timer-reset">Reset</button>
          </div>
          <div class="mt-2">
            <button class="btn btn-soft btn-sm" data-action="timer-log">✍ Log current session manually</button>
          </div>
        </div>
        <div>
          <div class="stats-grid mb-2">
            <div class="stat acc"><div class="k">Today</div><div class="v">${fmtMin(todayMin)}</div><div class="s">${today.length} sessions</div></div>
            <div class="stat"><div class="k">This Week</div><div class="v">${fmtMin(weekMinutes())}</div><div class="s">since Monday</div></div>
          </div>
          <div class="card">
            <div class="row mb-2"><h3>Recent Sessions</h3></div>
            ${recent || `<div class="empty"><span class="ic">⏱️</span>No sessions yet</div>`}
          </div>
        </div>
      </div>`);
  }

  function weekMinutes() {
    const st = compute();
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // Monday = 0
    const monday = addDays(now, -dow);
    let m = 0;
    st.sessions.forEach((s) => { if (s.date >= dstr(monday)) m += s.minutes; });
    return m;
  }

  /* ----- Syllabus ----- */
  function renderSyllabus() {
    const st = getState();
    const doneSet = st.syllabus || {};
    let total = 0, done = 0;
    const subjects = D.syllabus.map((sub) => {
      let sd = 0;
      const topics = sub.topics.map((t) => {
        total++; if (doneSet[t.id]) { done++; sd++; }
        return `<div class="topic ${doneSet[t.id] ? "done" : ""}" data-action="topic-toggle" data-id="${t.id}">
          <span class="box"></span><span class="name">${esc(t.name)}</span>
          <span class="status ${doneSet[t.id] ? "st-done" : "st-not"}">${doneSet[t.id] ? "Done" : "Not started"}</span>
        </div>`;
      }).join("");
      const pct = Math.round((sd / sub.topics.length) * 100);
      return `<div class="subj">
        <div class="subj-head" data-action="subject-toggle" data-id="${sub.id}">
          <span class="subj-ic">${sub.icon}</span>
          <div class="grow"><div style="font-weight:700">${esc(sub.name)}</div>
            <div style="font-size:.78rem;color:var(--muted-2)">${sd}/${sub.topics.length} topics · ~${sub.marks} marks</div></div>
          <div style="width:110px"><div class="progress thin"><i style="width:${pct}%"></i></div></div>
          <span class="muted" style="font-size:.85rem;width:40px;text-align:right">${pct}%</span>
        </div>
        <div class="subj-body">${topics}</div>
      </div>`;
    }).join("");
    const overall = total ? Math.round((done / total) * 100) : 0;
    return appShell(`
      <div class="page-head">
        <div><h1>Syllabus Tracker</h1><p>The complete GATE CSE syllabus — mark topics as you finish them.</p></div>
        <button class="btn btn-danger btn-sm" data-action="syllabus-reset">Reset all</button>
      </div>
      <div class="card mb-3">
        <div class="row">
          <div class="grow"><div class="k muted" style="font-size:.85rem">Overall progress</div>
            <h2 style="margin-top:4px">${done} of ${total} topics · ${overall}%</h2></div>
        </div>
        <div class="progress mt-2"><i style="width:${overall}%"></i></div>
      </div>
      ${subjects}`, "/syllabus");
  }

  /* ----- Tests ----- */
  function renderTests() {
    const st = compute();
    const tests = st.tests.slice().reverse();
    const rows = tests.map((t) => {
      const pct = t.total ? Math.round((t.scored / t.total) * 100) : 0;
      const cls = pct >= 70 ? "pill-green" : pct >= 40 ? "pill-amber" : "pill-red";
      return `<tr>
        <td><b>${esc(t.name)}</b></td>
        <td class="muted">${esc(t.subject)}</td>
        <td class="muted">${t.date}</td>
        <td><b>${t.scored}</b> / ${t.total}</td>
        <td><span class="pill ${cls}">${pct}%</span></td>
        <td style="text-align:right"><button class="btn btn-ghost btn-sm" data-action="test-delete" data-id="${t.id}">✕</button></td>
      </tr>`;
    }).join("");
    const perSub = {};
    st.tests.forEach((t) => {
      if (!perSub[t.subject]) perSub[t.subject] = { n: 0, sum: 0 };
      perSub[t.subject].n++; perSub[t.subject].sum += t.total ? (t.scored / t.total) * 100 : 0;
    });
    const subBars = Object.entries(perSub).map(([s, v]) => {
      const avg = Math.round(v.sum / v.n);
      return `<div class="mb-1"><div class="row" style="justify-content:space-between;font-size:.85rem"><span>${esc(s)}</span><span class="muted">${avg}%</span></div>
      <div class="progress thin"><i style="width:${avg}%"></i></div></div>`;
    }).join("");

    return appShell(`
      <div class="page-head"><div><h1>Test Series & Analytics</h1><p>Log your mock tests and track your scores.</p></div></div>
      <div class="grid-2 mb-3">
        <div class="card">
          <h3 class="mb-2">Add a Test</h3>
          <form data-form="add-test">
            <div class="field"><label>Test name</label><input class="input" name="testname" placeholder="e.g. FLT-1, Subject Test" required></div>
            <div class="field"><label>Subject</label><select class="input" name="subject">${subjectOptions("")}</select></div>
            <div class="field"><label>Date</label><input class="input" name="date" type="date" value="${todayStr()}" required></div>
            <div class="grid-2">
              <div class="field"><label>Marks scored</label><input class="input" name="scored" type="number" min="0" placeholder="65" required></div>
              <div class="field"><label>Total marks</label><input class="input" name="total" type="number" min="1" placeholder="100" required></div>
            </div>
            <button class="btn btn-primary btn-block" type="submit">Save Test</button>
          </form>
        </div>
        <div>
          <div class="stats-grid mb-2">
            <div class="stat"><div class="k">Tests</div><div class="v">${st.tests.length}</div></div>
            <div class="stat"><div class="k">Average</div><div class="v">${st.avg}%</div></div>
            <div class="stat"><div class="k">Best</div><div class="v">${st.best}%</div></div>
          </div>
          <div class="card"><h3 class="mb-2">Subject-wise average</h3>${subBars || '<p class="muted">No data yet</p>'}</div>
        </div>
      </div>
      <div class="card">
        <h3 class="mb-2">Test History</h3>
        ${tests.length ? `<table class="table"><thead><tr><th>Test</th><th>Subject</th><th>Date</th><th>Score</th><th>Result</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty"><span class="ic">📝</span>No tests logged yet</div>`}
      </div>`, "/tests");
  }

  /* ----- Calendar ----- */
  let calCursor = new Date();
  function renderCalendar() {
    const st = compute();
    const dayMap = {};
    st.sessions.forEach((s) => { dayMap[s.date] = (dayMap[s.date] || 0) + (Number(s.minutes) || 0); });
    const y = calCursor.getFullYear(), m = calCursor.getMonth();
    const first = new Date(y, m, 1);
    const startDow = (first.getDay() + 6) % 7;
    const dim = new Date(y, m + 1, 0).getDate();
    const monthName = first.toLocaleString("en", { month: "long", year: "numeric" });
    let cells = "";
    for (let i = 0; i < startDow; i++) cells += `<div></div>`;
    for (let d = 1; d <= dim; d++) {
      const ds = dstr(new Date(y, m, d));
      const min = dayMap[ds] || 0;
      let lv = ""; if (min > 0 && min < 60) lv = "lv-1"; else if (min < 180) lv = "lv-2"; else if (min < 300) lv = "lv-3"; else if (min >= 300) lv = "lv-4";
      const today = ds === todayStr() ? "today" : "";
      cells += `<div class="cal-day ${lv} ${today}" data-action="cal-day" data-date="${ds}">
        <span>${d}</span>${min ? `<span class="hrs">${fmtMin(min)}</span>` : ""}</div>`;
    }
    return appShell(`
      <div class="page-head"><div><h1>Study Calendar</h1><p>Your daily study hours, visualised.</p></div></div>
      <div class="card">
        <div class="cal-head">
          <button class="btn btn-ghost btn-sm" data-action="cal-prev">← Prev</button>
          <h3>${monthName}</h3>
          <button class="btn btn-ghost btn-sm" data-action="cal-next">Next →</button>
        </div>
        <div class="cal-grid">
          ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}
          ${cells}
        </div>
        <div class="heat-legend mt-2">Less <span class="day"></span><span class="day l1"></span><span class="day l2"></span><span class="day l3"></span><span class="day l4"></span> More</div>
      </div>`, "/calendar");
  }

  /* ----- Leaderboard ----- */
  function renderLeaderboard(metric) {
    metric = metric || "hours";
    const st = compute();
    const myKey = me();
    const rows = D.leaders.map((l, i) => ({
      name: l.name, hours: l.hours, questions: l.questions, streak: l.streak, rank: i + 1, me: false,
    }));
    rows.push({ name: meUser().name + " (You)", hours: Math.round(st.hours), questions: st.answered, streak: st.streak, rank: 0, me: true });
    rows.sort((a, b) => b[metric] - a[metric]);
    rows.forEach((r, i) => (r.rank = i + 1));
    const html = rows.map((r) => {
      const top = r.me ? "me" : r.rank === 1 ? "top1" : r.rank === 2 ? "top2" : r.rank === 3 ? "top3" : "";
      const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : "";
      const val = metric === "hours" ? r.hours : r.questions;
      return `<div class="rank-row ${top}">
        <span class="rank-no">${medal || r.rank}</span>
        <span class="avatar" style="${r.me ? "" : "background:" + colorFor(r.name) + ";color:#04100c"}">${esc(r.name[0].toUpperCase())}</span>
        <span class="name" data-action="profile-view" data-name="${esc(r.name)}" data-hours="${r.hours}" data-questions="${r.questions}" data-streak="${r.streak}">${esc(r.name)}</span>
        <span class="stat">🔥 ${r.streak}</span>
        <span class="stat"><b>${val.toLocaleString()}</b> ${metric === "hours" ? "hrs" : "ques"}</span>
      </div>`;
    }).join("");
    return appShell(`
      <div class="page-head">
        <div><h1>Leaderboard</h1><p>Compete with aspirants across India.</p></div>
        <div class="row" style="gap:8px">
          <button class="btn ${metric === "hours" ? "btn-soft" : "btn-ghost"} btn-sm" data-action="leader-metric" data-metric="hours">Study hours</button>
          <button class="btn ${metric === "questions" ? "btn-soft" : "btn-ghost"} btn-sm" data-action="leader-metric" data-metric="questions">Questions</button>
        </div>
      </div>
      ${html}`, "/leaderboard");
  }

  /* ----- Notes / Todos / Doubts ----- */
  function renderNotes(filter) {
    const st = getState();
    const notes = (st.notes || []).slice().reverse();
    const tags = [...new Set(notes.map((n) => n.tag).filter(Boolean))];
    const list = notes.filter((n) => !filter || n.tag === filter).map((n) => `
      <div class="note-tile mb-1">
        <div class="row"><span class="tag">${esc(n.tag || "general")}</span><div class="grow"></div>
          <button class="btn btn-ghost btn-sm" data-action="note-share" data-id="${n.id}">↗ Share</button>
          <button class="btn btn-danger btn-sm" data-action="note-delete" data-id="${n.id}">✕</button></div>
        <p>${esc(n.body)}</p>
        <div style="font-size:.74rem;color:var(--muted-2);margin-top:8px">${n.date}</div>
      </div>`).join("");
    return appShell(`
      <div class="page-head"><div><h1>Notes</h1><p>All notes, one place.</p></div></div>
      <div class="card mb-3">
        <h3 class="mb-2">New note</h3>
        <form data-form="add-note">
          <div class="field"><label>Tag (optional)</label><input class="input" name="tag" placeholder="e.g. OS, DBMS, formula, revision"></div>
          <div class="field"><label>Note</label><textarea class="input" name="body" placeholder="Write your note…" required></textarea></div>
          <button class="btn btn-primary" type="submit">Save note</button>
        </form>
      </div>
      ${tags.length ? `<div class="mb-2">${tags.map((t) => `<button class="tag-chip ${filter === t ? "on" : ""}" data-action="note-filter" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}${filter ? `<button class="tag-chip" data-action="note-filter" data-tag="">clear ✕</button>` : ""}</div>` : ""}
      ${list || `<div class="empty"><span class="ic">🗒️</span>No notes yet</div>`}`, "/notes");
  }

  function renderTodos(filter) {
    const st = getState();
    const todos = st.todos || [];
    const list = todos.filter((t) => filter === "done" ? t.done : filter === "open" ? !t.done : true).map((t) => `
      <div class="list-item">
        <input type="checkbox" style="margin-top:3px" ${t.done ? "checked" : ""} data-action="todo-toggle" data-id="${t.id}">
        <div class="grow" style="${t.done ? "text-decoration:line-through;color:var(--muted-2)" : ""}">${esc(t.text)}</div>
        <button class="btn btn-danger btn-sm" data-action="todo-delete" data-id="${t.id}">✕</button>
      </div>`).join("");
    const open = todos.filter((t) => !t.done).length;
    return appShell(`
      <div class="page-head"><div><h1>To-do List</h1><p>Advanced task planner — ${open} open task${open === 1 ? "" : "s"}.</p></div></div>
      <div class="card mb-3">
        <form data-form="add-todo" class="row" style="gap:10px">
          <input class="input grow" name="text" placeholder="Add a task… (e.g. Revise normalisation)" required>
          <button class="btn btn-primary" type="submit">Add</button>
        </form>
      </div>
      <div class="mb-2">
        <button class="tag-chip ${!filter ? "on" : ""}" data-action="todo-filter" data-filter="">All</button>
        <button class="tag-chip ${filter === "open" ? "on" : ""}" data-action="todo-filter" data-filter="open">Open</button>
        <button class="tag-chip ${filter === "done" ? "on" : ""}" data-action="todo-filter" data-filter="done">Done</button>
      </div>
      ${list || `<div class="empty"><span class="ic">✅</span>No tasks — add one above!</div>`}`, "/todos");
  }

  function renderDoubts() {
    const st = getState();
    const doubts = (st.doubts || []).slice().reverse();
    const list = doubts.map((d) => `
      <div class="list-item">
        <div class="grow">
          <div class="row" style="gap:8px"><span class="pill ${d.resolved ? "pill-green" : "pill-amber"}">${esc(d.subject)}</span>
            ${d.resolved ? `<span class="pill pill-green">Resolved ✓</span>` : ""}</div>
          <p style="margin:8px 0 0;color:#c7d0e4">${esc(d.text)}</p>
          <div style="font-size:.74rem;color:var(--muted-2);margin-top:6px">${d.date}</div>
        </div>
        <div class="row" style="gap:6px">
          <button class="btn btn-soft btn-sm" data-action="doubt-toggle" data-id="${d.id}">${d.resolved ? "Reopen" : "Resolve"}</button>
          <button class="btn btn-danger btn-sm" data-action="doubt-delete" data-id="${d.id}">✕</button>
        </div>
      </div>`).join("");
    return appShell(`
      <div class="page-head"><div><h1>Concepts & Doubts</h1><p>Log doubts, clear them, never lose track.</p></div></div>
      <div class="card mb-3">
        <h3 class="mb-2">New doubt</h3>
        <form data-form="add-doubt">
          <div class="field"><label>Subject</label><select class="input" name="subject">${subjectOptions("")}</select></div>
          <div class="field"><label>Doubt</label><textarea class="input" name="text" placeholder="Describe your doubt…" required></textarea></div>
          <button class="btn btn-primary" type="submit">Add doubt</button>
        </form>
      </div>
      ${list || `<div class="empty"><span class="ic">❓</span>No doubts — great sign, or add one!</div>`}`, "/doubts");
  }

  /* ----- PYQ Find ----- */
  function renderPyq(filter) {
    const subjects = ["All", ...new Set(D.pyqs.map((p) => p.subject))];
    const list = D.pyqs.filter((p) => !filter || filter === "All" || p.subject === filter).map((p, i) => `
      <div class="quiz-q" id="pyq-${i}">
        <div class="row" style="gap:8px;margin-bottom:8px"><span class="pill pill-blue">${esc(p.subject)}</span><span class="muted" style="font-size:.78rem">Practice question</span></div>
        <div style="font-weight:600">${esc(p.q)}</div>
        <div id="pyq-opts-${i}">
          ${p.options.map((o, oi) => `<div class="opt" data-action="pyq-reveal" data-id="${i}" data-opt="${oi}"><span class="key">${String.fromCharCode(65 + oi)}.</span> ${esc(o)}</div>`).join("")}
        </div>
      </div>`).join("");
    return appShell(`
      <div class="page-head"><div><h1>GATE PYQ Find</h1><p>Curated previous-year style questions. Tap an option to reveal the answer.</p></div></div>
      <div class="mb-2">${subjects.map((s) => `<button class="tag-chip ${(filter || "All") === s ? "on" : ""}" data-action="pyq-filter" data-subject="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      ${list}`, "/pyq");
  }

  /* ----- Practice Arena ----- */
  let quiz = null;
  function renderPractice() {
    const st = getState();
    const acc = st.practice ? Math.round((st.practice.correct / Math.max(1, st.practice.answered)) * 100) : 0;
    let body;
    if (quiz) {
      const q = quiz.qs[quiz.idx];
      const isDone = quiz.done;
      body = `
        <div class="row mb-2"><span class="pill pill-green">${esc(q.subject)}</span><div class="grow"></div><span class="muted" style="font-size:.85rem">Question ${quiz.idx + 1} / ${quiz.qs.length}</span></div>
        <h3 class="mb-2">${esc(q.q)}</h3>
        ${q.options.map((o, oi) => {
          let cls = "";
          if (isDone) { if (oi === q.answer) cls = "correct"; else if (oi === quiz.picked) cls = "wrong"; }
          else if (oi === quiz.picked) cls = "sel";
          return `<div class="opt ${cls}" data-action="practice-answer" data-opt="${oi}"><span class="key">${String.fromCharCode(65 + oi)}.</span> ${esc(o)}</div>`;
        }).join("")}
        <div class="row mt-2" style="gap:10px;justify-content:flex-end">
          ${isDone ? (quiz.idx < quiz.qs.length - 1 ? `<button class="btn btn-primary" data-action="practice-next">Next →</button>` : `<button class="btn btn-primary" data-action="practice-finish">Finish</button>`) : ""}
        </div>`;
    } else {
      body = `<div class="center" style="padding:20px">
        <div style="font-size:3rem">⚔️</div>
        <h3 class="mt-2">Practice Arena</h3>
        <p class="muted">5 rapid questions to sharpen your basics.</p>
        <button class="btn btn-primary btn-lg mt-2" data-action="practice-start">Start a Set</button>
      </div>`;
    }
    return appShell(`
      <div class="page-head"><div><h1>Practice Arena</h1><p>Rapid-fire practice. ${st.answered} solved · ${acc}% accuracy.</p></div></div>
      <div class="card" style="max-width:680px">${body}</div>`, "/practice");
  }

  /* ----- Konsa Teacher ----- */
  function renderTeachers() {
    const st = getState();
    const chosen = st.teachers || {};
    const rows = D.teachers.map((t) => `
      <tr>
        <td><b>${esc(t.subject)}</b></td>
        <td>
          <select class="input" data-bind="teacher" data-subject="${esc(t.subject)}">
            <option value="${esc(t.resource)}" ${(chosen[t.subject] || t.resource) === t.resource ? "selected" : ""}>${esc(t.resource)} (${esc(t.type)})</option>
            <option value="Self study + PYQs" ${chosen[t.subject] === "Self study + PYQs" ? "selected" : ""}>Self study + PYQs</option>
            <option value="Coaching institute batch" ${chosen[t.subject] === "Coaching institute batch" ? "selected" : ""}>Coaching institute batch</option>
          </select>
        </td>
      </tr>`).join("");
    return appShell(`
      <div class="page-head"><div><h1>Konsa Teacher</h1><p>Decide which resource to follow for every subject, and stick to it.</p></div></div>
      <div class="card">
        <table class="table"><thead><tr><th>Subject</th><th>Your chosen resource</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="muted" style="font-size:.82rem;margin-top:12px">Pre-filled with free, official NPTEL (IIT) courses. Pick what works best for you.</p>
      </div>`, "/teachers");
  }

  /* ----- Text & Link Share ----- */
  function renderShare() {
    const st = getState();
    const shares = (st.shares || []).slice().reverse();
    const list = shares.map((s) => `
      <div class="list-item">
        <div class="grow">
          <div class="row" style="gap:8px"><span class="pill pill-blue">${s.kind === "link" ? "🔗 Link" : "📝 Text"}</span>${s.tag ? `<span class="tag-chip on">#${esc(s.tag)}</span>` : ""}</div>
          <p style="margin:8px 0 0;color:#c7d0e4;word-break:break-word">${esc(s.body)}</p>
          <div style="font-size:.74rem;color:var(--muted-2);margin-top:6px">${s.date}</div>
        </div>
        <div class="row" style="gap:6px">
          <button class="btn btn-soft btn-sm" data-action="share-copy" data-id="${s.id}">Copy</button>
          <button class="btn btn-danger btn-sm" data-action="share-delete" data-id="${s.id}">✕</button>
        </div>
      </div>`).join("");
    return appShell(`
      <div class="page-head"><div><h1>Text & Link Share</h1><p>Keep your notes, links and resources handy — copy them in one tap.</p></div></div>
      <div class="card mb-3">
        <h3 class="mb-2">New share</h3>
        <form data-form="add-share">
          <div class="field">
            <label>Type</label>
            <select class="input" name="kind"><option value="text">Text</option><option value="link">Link</option></select>
          </div>
          <div class="field"><label>Tag (optional)</label><input class="input" name="tag" placeholder="e.g. revision, os-notes"></div>
          <div class="field"><label>Text or link</label><textarea class="input" name="body" placeholder="Paste text or a link…" required></textarea></div>
          <button class="btn btn-primary" type="submit">Save</button>
        </form>
      </div>
      ${list || `<div class="empty"><span class="ic">🔗</span>Nothing shared yet — save your first note or link above.</div>`}`, "/share");
  }

  /* ----- How to prepare ----- */
  function renderPrepare() {
    return appShell(`
      <div class="page-head"><div><h1>How to Prepare for GATE</h1><p>A simple, proven roadmap for GATE CSE ${SITE.gateYear}.</p></div></div>
      <div class="prose">
        <div class="card mb-2">
          <h2>1. Know the syllabus & weightage</h2>
          <p>Start with the <a href="/syllabus">official syllabus tracker</a>. Subjects like Programming & Data Structures, Algorithms, Operating Systems, DBMS and Computer Networks carry heavy weight. Engineering Mathematics (13 marks) and General Aptitude (15 marks) are huge differentiators.</p>
        </div>
        <div class="card mb-2">
          <h2>2. Follow ONE resource per subject</h2>
          <p>Use the <a href="/teachers">Konsa Teacher</a> tool to lock one teacher/book per subject. Avoid resource hopping — finish the material you start.</p>
        </div>
        <div class="card mb-2">
          <h2>3. Study in focused blocks</h2>
          <p>Use the <a href="/timer">Pomodoro Focus Timer</a> for 1–3 hour deep-work sessions. Log every session so your <a href="/calendar">calendar heatmap</a> stays green.</p>
        </div>
        <div class="card mb-2">
          <h2>4. Practice daily</h2>
          <p>Solve <a href="/practice">Practice Arena</a> sets and <a href="/pyq">PYQs</a> every day. Mark your doubts in <a href="/doubts">Concepts & Doubts</a> and revise them weekly.</p>
        </div>
        <div class="card mb-2">
          <h2>5. Test & analyse</h2>
          <p>Take full-length and subject tests, log them in <a href="/tests">Test Series</a>, and watch your subject-wise analytics. Learn from every mistake.</p>
        </div>
        <div class="card">
          <h2>6. Stay consistent</h2>
          <p>Track your streak on the dashboard and compete on the <a href="/leaderboard">leaderboard</a>. Consistency beats intensity — show up every single day.</p>
        </div>
      </div>`, "/prepare-for-gate");
  }

  /* ----- Profile ----- */
  function renderProfile() {
    const u = meUser();
    const st = compute();
    const created = u.createdAt ? new Date(u.createdAt).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" }) : "—";
    return appShell(`
      <div class="page-head"><div><h1>Profile</h1><p>Your account and preparation summary.</p></div></div>
      <div class="grid-2">
        <div class="card">
          <div class="row" style="gap:14px">
            <span class="avatar ${u.google ? "avatar-google" : ""}" style="width:56px;height:56px;font-size:1.4rem;${u.google ? "" : "background:" + colorFor(u.username)}">${esc((u.name || u.username)[0].toUpperCase())}</span>
            <div><h3>${esc(u.name)}</h3><p class="muted" style="margin:2px 0 0">@${esc(u.username)}</p></div>
          </div>
          <div class="divider"></div>
          <form data-form="profile-save">
            <div class="field"><label>Full name</label><input class="input" name="fullname" value="${esc(u.name)}"></div>
            <div class="field"><label>Email</label><input class="input" value="${esc(u.email)}" disabled></div>
            <button class="btn btn-primary" type="submit">Save changes</button>
          </form>
        </div>
        <div>
          <div class="stats-grid mb-2">
            <div class="stat"><div class="k">Member since</div><div class="v" style="font-size:1.1rem">${created}</div></div>
            <div class="stat"><div class="k">Sign-in</div><div class="v" style="font-size:1rem">${u.google ? "Google" : "Email"}</div></div>
          </div>
          <div class="card mb-2">
            <h3 class="mb-2">Trial status</h3>
            ${trialActive() ? `<span class="pill pill-green">✦ Pro trial active — ${trialDaysLeft()} days left</span>` : `<p class="muted">Your 21-day free trial has ended. <a class="link" href="/plans">Choose a plan →</a></p>`}
          </div>
          <div class="card">
            <h3 class="mb-2">Danger zone</h3>
            <button class="btn btn-danger" data-action="profile-reset">Reset all my data</button>
          </div>
        </div>
      </div>`, "/profile");
  }

  /* ----- Plans (public) ----- */
  function renderPlans() {
    const p = D.plans;
    const rows = p.compare.map((r) => `<tr><td>${esc(r.feature)}</td><td class="${r.free ? "yes" : "no"}">${r.free ? "✓" : "—"}</td><td class="yes">✓</td></tr>`).join("");
    const includes = p.includes.map((i) => `<div class="row" style="gap:8px;padding:6px 0"><span style="color:#34d399">✓</span><span class="muted">${esc(i)}</span></div>`).join("");
    return `
    <div class="bg-grid"></div>
    <div style="min-height:100vh;display:flex;flex-direction:column">
      <div class="container" style="padding-top:20px">
        <a class="brand" href="/">${logoHTML(0.82)}</a>
      </div>
      <div class="container page" style="padding-top:8px">
        <div class="pricing-hero">
          <div class="tag">${p.heading}</div>
          <h1 style="margin-top:10px">${p.title}</h1>
          <p class="muted" style="margin-top:8px;font-size:1.05rem">${p.subtitle}</p>
          <div class="row" style="justify-content:center;gap:18px;margin-top:14px;flex-wrap:wrap">
            ${p.bullets.map((b) => `<span class="muted" style="font-size:.88rem">✓ ${esc(b)}</span>`).join("")}
          </div>
          <p class="muted" style="margin-top:12px;font-size:.82rem">${p.checkout}</p>
        </div>
        <div class="pricing-cards">
          <div class="card price-card">
            <h3>Monthly</h3>
            <div class="amt">${p.priceMonthly.amount}<span class="per">${p.priceMonthly.period}</span></div>
            <p class="note">Flexible, cancel anytime.</p>
            <button class="btn btn-ghost btn-block mt-2" data-action="plan-pro" data-plan="monthly">Get Monthly</button>
          </div>
          <div class="card price-card featured">
            <span class="badge">${p.priceBundle.badge}</span>
            <h3>Bundle</h3>
            <div class="amt">${p.priceBundle.amount}<span class="per">${p.priceBundle.period}</span></div>
            <p class="note">${p.priceBundle.note}</p>
            <button class="btn btn-primary btn-block mt-2" data-action="plan-pro" data-plan="bundle">Get the Bundle</button>
          </div>
        </div>
        <p class="center muted" style="margin:-8px 0 26px">Or <a class="link" href="#" data-action="plan-trial">start your 21-day free trial</a> — no payment details needed.</p>
        <div class="card mb-3">
          <h3 class="center mb-3">Compare · Free vs Pro</h3>
          <div style="overflow:auto"><table class="compare-table"><thead><tr><th>Feature</th><th>Free</th><th>Pro</th></tr></thead><tbody>${rows}</tbody></table></div>
        </div>
        <div class="grid-2 mb-3">
          <div class="card"><h3 class="mb-2">Every plan includes</h3>${includes}</div>
          <div class="card" style="display:flex;flex-direction:column;justify-content:center;text-align:center">
            <div class="tag" style="letter-spacing:.28em">${p.foot[0]}</div>
            <p class="muted mt-2">${p.foot[1]}</p>
            <h3 class="mt-2">${p.foot[2]}</h3>
          </div>
        </div>
        <div class="row center" style="gap:18px;justify-content:center;flex-wrap:wrap;font-size:.85rem;padding-bottom:40px">
          <a class="link-muted" href="/cancellation-and-refund">Refund policy</a>
          <a class="link-muted" href="/terms-and-conditions">Terms</a>
          <a class="link-muted" href="/privacy-policy">Privacy</a>
          <a class="link-muted" href="/thankyou">Need help?</a>
        </div>
      </div>
    </div>`;
  }

  /* ----- Thank you (public) ----- */
  function renderThankyou() {
    const faq = D.faq.map((f, i) => `
      <div class="faq-item" data-id="${i}">
        <button class="faq-q" data-action="faq-toggle" data-id="${i}">${esc(f.q)}</button>
        <div class="faq-a">${esc(f.a)}</div>
      </div>`).join("");
    const letter = `
      <p><b>Dear Aspirants,</b></p>
      <p>Thank you for using this tracker. I built it to make GATE &amp; DSA preparation easier to track — your study hours, tests, syllabus progress and streaks, all in one place.</p>
      <p>Stay consistent, track your progress, and get where you're going. Let's keep preparing, let's keep improving — and let's reach GATE ${SITE.gateYear} together.</p>
      <div class="quote">"Stay consistent today, thank yourself on exam day."</div>
      <p>Every aspirant gets a <b>21-day free trial</b> — no payment details needed to start.</p>
      <p><b>— ${esc(SITE.creator.name)}</b></p>
      <p class="muted" style="font-size:.85rem">Created by ${esc(SITE.creator.name)} · Thanks to ${esc(SITE.creator.thanks)} for the original idea.</p>`;
    return `
    <div class="bg-grid"></div>
    <div style="min-height:100vh;display:flex;flex-direction:column">
      <div class="container page">
        <div class="letter">
          <div class="card">${letter}</div>
          <h2 class="center mt-3 mb-2">Frequently Asked Questions</h2>
          <p class="center muted mb-3" style="margin-top:-6px">To help you understand the plans better</p>
          ${faq}
        </div>
      </div>
      ${footerHTML()}
    </div>`;
  }

  /* ----- 404 ----- */
  function render404() {
    return `
    <div class="bg-grid"></div>
    <div style="min-height:100vh;display:flex;flex-direction:column">
      <div class="container page center" style="padding-top:80px">
        <h1 style="font-size:4rem"># 404</h1>
        <h2 class="mt-2">This page could not be found.</h2>
        <a class="btn btn-primary mt-3" href="/">Back to Home</a>
      </div>
      ${footerHTML()}
    </div>`;
  }

  /* ============================================================
     ACTIONS / FORMS
     ============================================================ */

  const nextParam = () => {
    const q = new URLSearchParams(location.search);
    return q.get("next") || "/";
  };

  function loginSuccess(u) {
    LS.setSession(u.username);
    closeModal();
    const nxt = nextParam();
    navigate(nxt && nxt.startsWith("/") ? nxt : "/");
    toast(`Welcome back, ${u.name.split(" ")[0]}!`);
  }

  const field = (f, name) => { const el = f.elements.namedItem(name); return el ? el.value : ""; };

  const FORMS = {
    login(f) {
      const err = $("#login-err");
      const id = field(f, "login").trim();
      const pass = field(f, "password");
      const users = LS.users();
      const u = Object.values(users).find((x) => x.username === id || x.email === id);
      if (!u || u.password !== pass) {
        err.innerHTML = `<div class="form-error">Invalid username/email or password.</div>`;
        return;
      }
      loginSuccess(u);
    },
    signup(f) {
      const err = $("#signup-err");
      const name = field(f, "fullname").trim();
      const username = field(f, "username").trim();
      const email = field(f, "email").trim();
      const password = field(f, "password");
      err.innerHTML = "";
      if (!name) { err.innerHTML = `<div class="form-error">Please enter your full name.</div>`; return; }
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        err.innerHTML = `<div class="form-error">Username must be 3–20 characters: letters, numbers and underscores only, no spaces.</div>`; return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.innerHTML = `<div class="form-error">Please enter a valid email address.</div>`; return;
      }
      if (password.length < 6) {
        err.innerHTML = `<div class="form-error">Password must be at least 6 characters.</div>`; return;
      }
      const users = LS.users();
      if (Object.values(users).some((x) => x.username === username)) {
        err.innerHTML = `<div class="form-error">That username is already taken.</div>`; return;
      }
      if (Object.values(users).some((x) => x.email === email)) {
        err.innerHTML = `<div class="form-error">An account with that email already exists.</div>`; return;
      }
      const u = { name, username, email, password, createdAt: Date.now(), google: false };
      users[username] = u;
      LS.saveUsers(users);
      loginSuccess(u);
      toast("Account created — welcome to G4Gate!");
    },
    forgot(f) {
      const msg = $("#forgot-msg");
      const email = field(f, "email").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.innerHTML = `<div class="form-error">Please enter a valid email address.</div>`; return;
      }
      msg.innerHTML = `<div class="form-success">If an account exists for <b>${esc(email)}</b>, a password reset link has been sent.</div>`;
      f.reset();
    },
    "add-test"(f) {
      const t = {
        id: uid(), name: field(f, "testname").trim(), subject: field(f, "subject"),
        date: field(f, "date"), scored: Number(field(f, "scored")), total: Number(field(f, "total")),
      };
      if (t.total <= 0) { toast("Total marks must be greater than 0", "err"); return; }
      const st = getState(); st.tests = st.tests || []; st.tests.push(t);
      setState({ tests: st.tests }); render(); toast("Test saved!");
    },
    "log-hours"(f) {
      const minutes = Number(field(f, "minutes"));
      const subject = field(f, "subject");
      const date = field(f, "date");
      const st = getState(); st.sessions = st.sessions || [];
      st.sessions.push({ id: uid(), subject, minutes, date, at: Date.now() });
      setState({ sessions: st.sessions });
      closeModal(); render(); toast(`Logged ${fmtMin(minutes)} for ${subject}`);
    },
    "add-note"(f) {
      const st = getState(); st.notes = st.notes || [];
      st.notes.push({ id: uid(), tag: field(f, "tag").trim().toLowerCase(), body: field(f, "body").trim(), date: todayStr(), at: Date.now() });
      setState({ notes: st.notes }); render(); toast("Note saved!");
    },
    "add-todo"(f) {
      const st = getState(); st.todos = st.todos || [];
      st.todos.push({ id: uid(), text: field(f, "text").trim(), done: false, at: Date.now() });
      setState({ todos: st.todos }); render(); toast("Task added");
    },
    "add-doubt"(f) {
      const st = getState(); st.doubts = st.doubts || [];
      st.doubts.push({ id: uid(), subject: field(f, "subject"), text: field(f, "text").trim(), resolved: false, date: todayStr() });
      setState({ doubts: st.doubts }); render(); toast("Doubt logged — clear it soon!");
    },
    "profile-save"(f) {
      const users = LS.users(); const u = users[me()];
      u.name = field(f, "fullname").trim() || u.name;
      LS.saveUsers(users); render(); toast("Profile updated");
    },
    "add-share"(f) {
      const st = getState(); st.shares = st.shares || [];
      st.shares.push({ id: uid(), kind: field(f, "kind"), tag: field(f, "tag").trim().toLowerCase(), body: field(f, "body").trim(), date: todayStr(), at: Date.now() });
      setState({ shares: st.shares }); render(); toast("Saved to your shares");
    },
  };

  const ACTIONS = {
    "google-auth"(t) {
      const label = t.dataset.label || "Sign in with Google";
      t.innerHTML = `${ICONS.google} Connecting…`;
      t.disabled = true;
      setTimeout(() => {
        const users = LS.users();
        const key = "google_demo";
        let u = users[key];
        if (!u) {
          u = { name: "GATE Aspirant", username: "google_demo", email: "aspirant.g4gate@gmail.com", password: "", createdAt: Date.now(), google: true };
          users[key] = u; LS.saveUsers(users);
        }
        loginSuccess(u);
        toast("Signed in with Google");
      }, 700);
    },
    logout() { LS.setSession(""); Timer.pause(); navigate("/login"); toast("Logged out — see you soon!"); },
    "dropdown-toggle"(t) {
      const id = t.dataset.target;
      const dd = document.getElementById(id);
      const open = dd.classList.contains("open");
      $$(".dropdown").forEach((d) => d.classList.remove("open"));
      if (!open) dd.classList.add("open");
      if (id === "bell-menu") {
        const seen = getState().notifSeen || {};
        ["welcome", "countdown", "pyq", "streak"].forEach((n) => (seen[n] = true));
        setState({ notifSeen: seen });
      }
    },
    "mobile-toggle"() { const s = $("#sidebar"); if (s) s.classList.toggle("open"); $("#scrim")?.classList.toggle("show"); },
    "sidebar-toggle"() { const s = $("#sidebar"); if (s) s.classList.toggle("open"); $("#scrim")?.classList.toggle("show"); },
    "sidebar-close"() { $("#sidebar")?.classList.remove("open"); $("#scrim")?.classList.remove("show"); },
    "timer-toggle"() { Timer.running ? Timer.pause() : Timer.start(); },
    "timer-reset"() { Timer.reset(); },
    "timer-preset"(t) { Timer.setPreset(Number(t.dataset.sec), t.dataset.label); $$(".preset").forEach((p) => p.classList.remove("active")); t.classList.add("active"); },
    "timer-log"() {
      const elapsed = Math.round((Timer.total - Timer.remaining) / 60);
      if (elapsed < 1) { toast("Start a session first, or log manually from the calendar", "err"); return; }
      Timer.log(elapsed); toast(`Logged ${fmtMin(elapsed)} for ${Timer.subject}`); render();
    },
    "topic-toggle"(t) {
      const id = t.dataset.id;
      const st = getState(); const syl = st.syllabus || {};
      syl[id] = !syl[id];
      setState({ syllabus: syl });
      t.classList.toggle("done");
      const status = t.querySelector(".status");
      if (status) { status.textContent = syl[id] ? "Done" : "Not started"; status.className = "status " + (syl[id] ? "st-done" : "st-not"); }
      if (syl[id]) confetti();
      toast(syl[id] ? "Topic completed 🎉" : "Topic unmarked");
      render();
    },
    "subject-toggle"(t) {
      const body = t.parentElement.querySelector(".subj-body");
      if (body) body.style.display = body.style.display === "none" ? "" : "none";
    },
    "syllabus-reset"() {
      if (!confirm("Reset ALL syllabus progress? This cannot be undone.")) return;
      setState({ syllabus: {} }); render(); toast("Syllabus progress reset");
    },
    "test-delete"(t) {
      const st = getState();
      st.tests = (st.tests || []).filter((x) => x.id !== t.dataset.id);
      setState({ tests: st.tests }); render(); toast("Test deleted");
    },
    "cal-prev"() { calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1); render(); },
    "cal-next"() { calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1); render(); },
    "cal-day"(t) {
      const ds = t.dataset.date;
      const st = compute();
      const sessions = st.sessions.filter((s) => s.date === ds);
      const html = sessions.length ? sessions.map((s) => `<div class="session"><span class="dot"></span><div class="grow" style="font-weight:600">${esc(s.subject)}</div><span class="muted">${fmtMin(s.minutes)}</span></div>`).join("")
        : `<p class="muted">No sessions logged on this day.</p>`;
      openModal(`
        <div class="row mb-2"><h3>${ds}</h3><div class="grow"></div><button class="btn btn-ghost btn-sm" data-action="close-modal">✕</button></div>
        <div id="cal-sessions">${html}</div>
        <div class="divider" style="margin:14px 0"></div>
        <form data-form="log-hours">
          <input type="hidden" name="date" value="${ds}">
          <div class="field"><label>Subject</label><select class="input" name="subject">${subjectOptions("")}</select></div>
          <div class="field"><label>Minutes studied</label><input class="input" name="minutes" type="number" min="1" step="5" placeholder="60" required></div>
          <button class="btn btn-primary btn-block" type="submit">Log session</button>
        </form>`);
    },
    "close-modal"() { closeModal(); },
    "backdrop-close"(t, e) { if (e.target === t) closeModal(); },
    "leader-metric"(t) { renderLeaderboard(t.dataset.metric); },
    "note-filter"(t) { renderNotes(t.dataset.tag || null); },
    "note-delete"(t) {
      const st = getState(); st.notes = (st.notes || []).filter((x) => x.id !== t.dataset.id);
      setState({ notes: st.notes }); render(); toast("Note deleted");
    },
    "note-share"(t) {
      const st = getState();
      const n = (st.notes || []).find((x) => x.id === t.dataset.id);
      if (!n) return;
      const text = `G4Gate Note [${n.tag || "general"}]\n${n.body}`;
      const done = () => toast("Note copied to clipboard — share it anywhere!");
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => done());
      else done();
    },
    "todo-filter"(t) { renderTodos(t.dataset.filter || null); },
    "todo-toggle"(t) {
      const st = getState(); const todo = (st.todos || []).find((x) => x.id === t.dataset.id);
      if (todo) { todo.done = !todo.done; setState({ todos: st.todos }); render(); }
    },
    "todo-delete"(t) {
      const st = getState(); st.todos = (st.todos || []).filter((x) => x.id !== t.dataset.id);
      setState({ todos: st.todos }); render();
    },
    "doubt-toggle"(t) {
      const st = getState(); const d = (st.doubts || []).find((x) => x.id === t.dataset.id);
      if (d) { d.resolved = !d.resolved; setState({ doubts: st.doubts }); render(); toast(d.resolved ? "Doubt resolved 🎉" : "Doubt reopened"); }
    },
    "doubt-delete"(t) {
      const st = getState(); st.doubts = (st.doubts || []).filter((x) => x.id !== t.dataset.id);
      setState({ doubts: st.doubts }); render();
    },
    "pyq-filter"(t) { renderPyq(t.dataset.subject); },
    "pyq-reveal"(t) {
      const id = Number(t.dataset.id), opt = Number(t.dataset.opt);
      const p = D.pyqs[id];
      const opts = $$(`#pyq-opts-${id} .opt`);
      opts.forEach((o, oi) => {
        o.classList.remove("sel", "correct", "wrong");
        if (oi === p.answer) o.classList.add("correct");
        else if (oi === opt) o.classList.add("wrong");
      });
      const container = $(`#pyq-${id}`);
      let ex = $(`#pyq-${id} .explain`);
      if (!ex) {
        ex = document.createElement("div");
        ex.className = "explain";
        ex.style.cssText = "margin-top:12px;padding:12px 14px;border-radius:10px;background:var(--accent-soft);color:#6ee7b7;font-size:.88rem";
        container.appendChild(ex);
      }
      ex.innerHTML = opt === p.answer
        ? `✅ Correct! <b>${String.fromCharCode(65 + p.answer)}</b> — ${esc(p.explain)}`
        : `❌ Not quite. Correct answer: <b>${String.fromCharCode(65 + p.answer)}</b>. ${esc(p.explain)}`;
    },
    "practice-start"() {
      const qs = [...D.practice].sort(() => Math.random() - 0.5).slice(0, 5);
      quiz = { qs, idx: 0, picked: null, done: false };
      render();
    },
    "practice-answer"(t) {
      if (!quiz || quiz.done) return;
      quiz.picked = Number(t.dataset.opt);
      quiz.done = true;
      const q = quiz.qs[quiz.idx];
      const st = getState();
      const pr = st.practice || { answered: 0, correct: 0 };
      pr.answered++; if (quiz.picked === q.answer) pr.correct++;
      setState({ practice: pr });
      render();
    },
    "practice-next"() { if (quiz) { quiz.idx++; quiz.picked = null; quiz.done = false; render(); } },
    "practice-finish"() {
      const st = getState();
      confetti();
      toast(`Set complete — ${st.practice?.correct || 0} correct so far. Keep going!`);
      quiz = null; render();
    },
    "plan-trial"() {
      if (!me()) { navigate("/signup?next=/plans"); return; }
      startTrial(); render(); toast("21-day free trial started — enjoy Pro!");
    },
    "plan-pro"() {
      openModal(`<div class="center"><div style="font-size:2.6rem">🧾</div>
        <h3 class="mt-1">Demo checkout</h3>
        <p class="muted mt-1">This is a clone of G4Gate for demonstration. Payments are disabled — on the real site this opens a secure checkout (UPI, cards, netbanking &amp; wallets).</p>
        <div class="row mt-2" style="gap:10px;justify-content:center">
          <button class="btn btn-ghost" data-action="close-modal">Close</button>
          <button class="btn btn-primary" data-action="plan-trial-modal">Start free trial</button>
        </div></div>`);
    },
    "plan-trial-modal"() { closeModal(); ACTIONS["plan-trial"]({}); },
    "faq-toggle"(t) {
      const item = t.closest(".faq-item");
      item.classList.toggle("open");
    },
    "analytics-modal"() {
      openModal(`<div class="center"><h3>📊 G4Gate Usage Report</h3>
        <p class="muted mt-1">As shared on ${new Date().toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })}.</p>
        <div class="stats-grid mt-2" style="grid-template-columns:1fr 1fr">
          <div class="stat"><div class="k">Active users / day</div><div class="v">150–200</div></div>
          <div class="stat"><div class="k">Daily visits</div><div class="v">~600</div></div>
          <div class="stat"><div class="k">Platform age</div><div class="v">1m 7d</div></div>
          <div class="stat"><div class="k">Launched</div><div class="v">6 Jul</div></div>
        </div>
        <button class="btn btn-primary mt-2" data-action="close-modal">Close</button></div>`);
    },
    "profile-reset"() {
      if (!confirm("Reset ALL your data (sessions, tests, notes, syllabus)? This cannot be undone.")) return;
      LS.saveState(me(), {});
      render(); toast("All data reset");
    },
    "share-copy"(t) {
      const st = getState();
      const s = (st.shares || []).find((x) => x.id === t.dataset.id);
      if (!s) return;
      const done = () => toast("Copied to clipboard!");
      if (navigator.clipboard) navigator.clipboard.writeText(s.body).then(done).catch(() => done());
      else done();
    },
    "share-delete"(t) {
      const st = getState();
      st.shares = (st.shares || []).filter((x) => x.id !== t.dataset.id);
      setState({ shares: st.shares }); render();
    },
    "profile-view"(t) {
      const name = t.dataset.name;
      openModal(`
        <div class="center">
          <span class="avatar" style="width:64px;height:64px;font-size:1.6rem;margin:0 auto;background:${colorFor(name)}">${esc(name[0].toUpperCase())}</span>
          <h3 class="mt-2">${esc(name)}</h3>
          <p class="muted" style="margin:2px 0 14px">Public profile</p>
          <div class="stats-grid" style="grid-template-columns:1fr 1fr 1fr">
            <div class="stat"><div class="k">Hours</div><div class="v">${esc(t.dataset.hours)}</div></div>
            <div class="stat"><div class="k">Questions</div><div class="v">${esc(t.dataset.questions)}</div></div>
            <div class="stat"><div class="k">Streak</div><div class="v">🔥 ${esc(t.dataset.streak)}</div></div>
          </div>
          <button class="btn btn-primary mt-2" data-action="close-modal">Close</button>
        </div>`);
    },
  };

  /* trial helpers */
  function trialActive() {
    const st = getState();
    return st.trialUntil && Date.now() < st.trialUntil;
  }
  function trialDaysLeft() {
    const st = getState();
    return Math.max(0, Math.ceil((st.trialUntil - Date.now()) / 86400000));
  }
  function startTrial() {
    setState({ trialUntil: Date.now() + 21 * 86400000 });
  }

  /* ---------------- input binding (change) ---------------- */
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!t.dataset || !t.dataset.bind) return;
    if (t.dataset.bind === "timer-subject") { Timer.subject = t.value; return; }
    if (t.dataset.bind === "teacher") {
      const st = getState(); st.teachers = st.teachers || {};
      st.teachers[t.dataset.subject] = t.value;
      setState({ teachers: st.teachers });
      toast(`${t.dataset.subject}: resource updated`);
    }
  });

  /* ---------------- global click / submit delegation ---------------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (a) {
      const href = a.getAttribute("href");
      if (href && href.startsWith("/") && !a.hasAttribute("target") && !a.hasAttribute("download")) {
        e.preventDefault();
        navigate(href);
        return;
      }
    }
    const t = e.target.closest("[data-action]");
    if (t) {
      const fn = ACTIONS[t.dataset.action];
      if (fn) fn(t, e);
    }
  });

  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-form]");
    if (f) {
      e.preventDefault();
      const fn = FORMS[f.dataset.form];
      if (fn) fn(f, e);
    }
  });

  /* ---------------- router ---------------- */
  const AUTH_ROUTES = ["/", "/timer", "/tests", "/calendar", "/syllabus", "/leaderboard", "/notes", "/todos", "/doubts", "/pyq", "/practice", "/teachers", "/prepare-for-gate", "/profile", "/share"];
  const TITLES = {
    "/": "Dashboard | G4Gate",
    "/login": "Login | G4Gate",
    "/signup": "Signup | G4Gate",
    "/forgot-password": "Forgot Password | G4Gate",
    "/plans": "Pricing Plans | G4Gate",
    "/timer": "Timer | G4Gate",
    "/tests": "Tests | G4Gate",
    "/calendar": "Calendar | G4Gate",
    "/syllabus": "Syllabus | G4Gate",
    "/leaderboard": "Leaderboard | G4Gate",
    "/notes": "Notes | G4Gate",
    "/todos": "To-do | G4Gate",
    "/doubts": "Doubts | G4Gate",
    "/pyq": "PYQ Find | G4Gate",
    "/practice": "Practice | G4Gate",
    "/teachers": "Konsa Teacher | G4Gate",
    "/prepare-for-gate": "Prepare | G4Gate",
    "/profile": "Profile | G4Gate",
    "/share": "Text & Link Share | G4Gate",
  };

  let countdownTimer = null;
  function render() {
    const path = location.pathname;
    // clear ticking timers
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    $$(".dropdown").forEach((d) => d.classList.remove("open"));
    $("#mobile-nav")?.classList.add("hidden");
    $("#sidebar")?.classList.remove("open");
    $("#scrim")?.classList.remove("show");

    const isPublic = ["/login", "/signup", "/forgot-password", "/about", "/contact", "/privacy-policy", "/terms-and-conditions", "/cancellation-and-refund", "/shipping-and-delivery", "/plans", "/thankyou"].includes(path);

    if (AUTH_ROUTES.includes(path) && !me()) {
      navigate(`/login?next=${encodeURIComponent(path)}`, true);
      return;
    }
    if ((path === "/login" || path === "/signup") && me()) {
      navigate("/", true);
      return;
    }

    let html = "";
    if (path === "/login") html = renderLogin(nextParam());
    else if (path === "/signup") html = renderSignup(nextParam());
    else if (path === "/forgot-password") html = renderForgot();
    else if (path === "/about") html = prosePage(PROSE.about.title, PROSE.about.sub, "", PROSE.about.body);
    else if (path === "/contact") html = prosePage(PROSE.contact.title, PROSE.contact.sub, "", PROSE.contact.body);
    else if (path === "/privacy-policy") html = prosePage(PROSE.privacy.title, PROSE.privacy.sub, PROSE.privacy.date, PROSE.privacy.body);
    else if (path === "/terms-and-conditions") html = prosePage(PROSE.terms.title, PROSE.terms.sub, PROSE.terms.date, PROSE.terms.body);
    else if (path === "/cancellation-and-refund") html = prosePage(PROSE.refund.title, PROSE.refund.sub, PROSE.refund.date, PROSE.refund.body);
    else if (path === "/shipping-and-delivery") html = prosePage(PROSE.shipping.title, PROSE.shipping.sub, PROSE.shipping.date, PROSE.shipping.body);
    else if (path === "/plans") html = renderPlans();
    else if (path === "/thankyou") html = renderThankyou();
    else if (path === "/") html = renderDashboard();
    else if (path === "/timer") html = renderTimer();
    else if (path === "/syllabus") html = renderSyllabus();
    else if (path === "/tests") html = renderTests();
    else if (path === "/calendar") html = renderCalendar();
    else if (path === "/leaderboard") html = renderLeaderboard();
    else if (path === "/notes") html = renderNotes();
    else if (path === "/todos") html = renderTodos();
    else if (path === "/doubts") html = renderDoubts();
    else if (path === "/pyq") html = renderPyq();
    else if (path === "/practice") html = renderPractice();
    else if (path === "/teachers") html = renderTeachers();
    else if (path === "/prepare-for-gate") html = renderPrepare();
    else if (path === "/profile") html = renderProfile();
    else if (path === "/share") html = renderShare();
    else html = render404();

    document.title = TITLES[path] || (isPublic ? "G4Gate — Study Tracker for GATE and DSA Aspirants" : "G4Gate");
    $("#app").innerHTML = html;

    // post-render hooks
    if (path === "/") { startCountdown(); countUp(); }
    if (path === "/timer") Timer.updateDom();
    window.scrollTo(0, 0);
  }

  function startCountdown() {
    const target = new Date(SITE.examDate).getTime();
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const set = (c, v) => { const el = $(`[data-c="${c}"]`); if (el) el.textContent = v; };
      set("d", d); set("h", h); set("m", m); set("s", s);
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function navigate(path, replace) {
    if (replace) history.replaceState({}, "", path);
    else if (location.pathname !== path) history.pushState({}, "", path);
    render();
  }

  window.addEventListener("popstate", render);

  /* ---------------- beep ---------------- */
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.2, 0.4].forEach((t, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 660 + i * 110;
        o.type = "sine";
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.32);
      });
    } catch { /* ignore */ }
  }

  // close dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-wrap]")) {
      $$(".dropdown").forEach((d) => d.classList.remove("open"));
    }
  });

  /* ---------------- global search ---------------- */
  const SEARCH_INDEX = [
    ...D.nav.map((n) => ({ label: n.label, href: n.href, icon: "📄" })),
    ...D.tools.map((t) => ({ label: t.label, href: t.href, icon: t.icon })),
    ...D.syllabus.map((s) => ({ label: s.name + " · syllabus", href: "/syllabus", icon: s.icon })),
  ];
  document.addEventListener("input", (e) => {
    if (e.target.id !== "global-search") return;
    const q = e.target.value.trim().toLowerCase();
    const box = $("#search-results");
    if (!box) return;
    if (!q) { box.classList.remove("open"); box.innerHTML = ""; return; }
    const hits = SEARCH_INDEX
      .filter((x) => x.label.toLowerCase().includes(q))
      .slice(0, 8);
    if (!hits.length) {
      box.innerHTML = `<div class="muted" style="padding:12px 14px;font-size:.86rem">No results for “${esc(q)}”</div>`;
    } else {
      box.innerHTML = hits.map((h) => `<a href="${h.href}">${h.icon} ${esc(h.label)}</a>`).join("");
    }
    box.classList.add("open");
  });

  /* ---------------- confetti & count-up ---------------- */
  function confetti() {
    try {
      const colors = ["#10b981", "#22d3ee", "#8b5cf6", "#f59e0b", "#ef4444", "#34d399"];
      const root = document.createElement("div");
      root.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:300;overflow:hidden";
      document.body.appendChild(root);
      for (let i = 0; i < 70; i++) {
        const p = document.createElement("div");
        const size = 6 + Math.random() * 6;
        p.style.cssText = `position:absolute;top:-20px;left:${Math.random() * 100}%;width:${size}px;height:${size * 0.6}px;background:${colors[i % colors.length]};border-radius:2px;transform:rotate(${Math.random() * 360}deg)`;
        root.appendChild(p);
        const drift = Math.random() * 160 - 80;
        const anim = p.animate([
          { transform: "translateY(-20px) rotate(0deg)", opacity: 0.95 },
          { transform: `translateY(${(window.innerHeight || 800) + 60}px) translateX(${drift}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0 },
        ], { duration: 1200 + Math.random() * 1100, easing: "cubic-bezier(.2,.6,.4,1)" });
        anim.onfinish = () => p.remove();
      }
      setTimeout(() => root.remove(), 2600);
    } catch { /* ignore */ }
  }

  function countUp() {
    $$("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const dec = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || "";
      const dur = 900;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = val.toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* boot */
  render();
})();
