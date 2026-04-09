import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import Logo from "../components/Logo";
import { getHighlighter, highlight as shikiHighlight } from "../lib/highlighter";
import type { Highlighter } from "shiki";

const DEMO_SRC = `${import.meta.env.BASE_URL}demo-ui/index.html`;

let _hl: Highlighter | null = null;

const BUTTON_TEST_CODE = `import { 
  describe, 
  it, 
  expect, 
  render, 
  fireEvent, 
  snapshot } from '@fieldtest/core'
import { Button } from './Button'

describe('Button', () => {
  it('fires onClick when clicked', async () => {
    let clicked = false

    const { getByRole } = await render(
      <Button
        label="Click me"
        onClick={() => { clicked = true }}
      />
    )

    // capture a visual snapshot before click
    await snapshot('initial')

    await fireEvent.click(getByRole('button'))
    expect(clicked).toBe(true)
  })
})`;

const FilmstripIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 8h2M2 12h2M2 16h2M20 8h2M20 12h2M20 16h2" />
    <rect x="7" y="8" width="10" height="8" rx="1" />
  </svg>
);

const CoverageIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3h18v18H3z" rx="2" />
    <path d="M7 8h4M7 12h8M7 16h6" />
    <circle cx="17" cy="8" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const AccessibilityIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="5" r="1.5" />
    <path d="M5 9h14M12 9v6M9 21l3-6 3 6" />
  </svg>
);

const TabsIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 6V4M12 6V4M18 6V4" />
  </svg>
);

const GraphIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="2" />
    <circle cx="4" cy="6" r="2" />
    <circle cx="20" cy="6" r="2" />
    <circle cx="4" cy="18" r="2" />
    <circle cx="20" cy="18" r="2" />
    <path d="M6 7l4 4M14 7l4-1M6 17l4-4M14 17l4 1" />
  </svg>
);

const CacheIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const BrowserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="16" rx="2" />
    <path d="M2 7h20M6 3v4M9 3v4" />
  </svg>
);

const NodeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8l4 4-4 4M12 16h6" />
  </svg>
);

const features = [
  {
    icon: <FilmstripIcon />,
    color: "g",
    title: "Visual Filmstrip",
    desc: "Every render step captured as a live snapshot. Scrub through exactly how your component looked at each point in the test.",
  },
  {
    icon: <CoverageIcon />,
    color: "g",
    title: "Per-test Coverage",
    desc: "See which lines each individual test exercises — not just aggregate coverage. Click a line to see which tests hit it.",
  },
  {
    icon: <AccessibilityIcon />,
    color: "g",
    title: "Accessibility Audits",
    desc: "axe-core runs automatically on every test. Failing rules highlight the exact DOM region. Passing tests show green too.",
  },
  {
    icon: <TabsIcon />,
    color: "y",
    title: "Extensible Tabs",
    desc: "Add custom tabs with registerTab() to expose whatever data your tests produce — network requests, performance marks, custom traces.",
  },
  {
    icon: <GraphIcon />,
    color: "y",
    title: "3D Coverage Graph",
    desc: "An interactive force-directed graph maps your test files to source files. Understand your coverage topology at a glance.",
  },
  {
    icon: <CacheIcon />,
    color: "y",
    title: "Smart Caching",
    desc: "Dependency graph analysis means only tests affected by your change re-run. Plus built-in sharding for CI parallelism.",
  },
];

export default function Home() {
  const [codeHtml, setCodeHtml] = useState<string | null>(null);

  useEffect(() => {
    if (_hl) {
      setCodeHtml(shikiHighlight(_hl, BUTTON_TEST_CODE, "tsx"));
      return;
    }
    getHighlighter().then((h) => {
      _hl = h;
      setCodeHtml(shikiHighlight(h, BUTTON_TEST_CODE, "tsx"));
    });
  }, []);

  function copyInstall() {
    navigator.clipboard.writeText("npm install -D fieldtest").catch(() => {});
  }

  return (
    <div className="min-h-screen bg-ft-bg font-sans text-ft-text">
      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="orb-1 absolute h-[520px] w-[520px] rounded-full opacity-[0.18]"
          style={{ background: "#2d6a4f", filter: "blur(90px)", top: "-140px", left: "-120px" }}
        />
        <div
          className="orb-2 absolute h-[380px] w-[380px] rounded-full opacity-[0.18]"
          style={{ background: "#c9960f", filter: "blur(90px)", bottom: "-80px", right: "-60px" }}
        />
        <div
          className="orb-3 absolute h-[280px] w-[280px] rounded-full opacity-[0.18]"
          style={{ background: "#40916c", filter: "blur(90px)", top: "40%", left: "55%" }}
        />
      </div>

      <div className="relative z-10">
        <Nav />

        {/* Hero — two columns: demo on the left, copy on the right */}
        <section className="px-6 pb-20 pt-16">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">
              {/* Left — live demo window */}
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-[-40px]"
                  style={{
                    background:
                      "radial-gradient(ellipse at 40% 50%, rgba(99,102,241,0.13) 0%, transparent 70%)",
                  }}
                />
                <div
                  className="overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
                  style={{ border: "1px solid #2a2a36" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderBottom: "1px solid #2a2a36",
                      background: "#0f0f13",
                    }}
                  >
                    <div style={{ display: "flex", gap: 6 }}>
                      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                        <div
                          key={c}
                          style={{ width: 11, height: 11, borderRadius: "50%", background: c }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "#6b7280",
                      }}
                    >
                      localhost:3333 — fieldtest
                    </div>
                  </div>
                  <iframe
                    src={DEMO_SRC}
                    title="fieldtest live demo"
                    style={{ width: "100%", height: "580px", border: "none", display: "block" }}
                  />
                </div>
              </div>

              {/* Right — hero copy */}
              <div className="lg:pl-4">
                <h1
                  className="mb-5 text-[clamp(38px,5vw,62px)] font-black leading-[1.06] tracking-[-2px]"
                  style={{
                    background: "linear-gradient(135deg, #ddeee6 0%, #74c69d 50%, #c9960f 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Tests you can
                  <br />
                  actually see.
                </h1>

                <p className="mb-8 text-[clamp(15px,2vw,17px)] leading-[1.7] text-ft-mid">
                  fieldtest is a visual test runner for React. Watch your components render
                  step-by-step, inspect coverage per test, audit accessibility, and catch network
                  requests — all in the browser.
                </p>

                <div className="mb-7 flex flex-wrap gap-3">
                  <Link
                    to="/docs"
                    className="flex items-center gap-2 rounded-xl bg-ft-green px-6 py-3 text-[15px] font-semibold text-white no-underline shadow-[0_0_24px_rgba(64,145,108,0.35)] transition-all hover:-translate-y-px hover:bg-ft-green-hi"
                  >
                    Get started
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <a
                    href="#features"
                    className="flex items-center gap-2 rounded-xl border border-white/7 px-6 py-3 text-[15px] font-medium text-ft-mid no-underline transition-all hover:-translate-y-px hover:border-white/20 hover:text-ft-text"
                  >
                    See features
                  </a>
                </div>

                {/* Install snippet */}
                <div className="flex items-center gap-2.5 rounded-lg border border-white/7 bg-ft-surface px-4 py-2.5 font-mono text-sm text-ft-text w-fit">
                  <span className="text-ft-green">$</span>
                  <span>npm install -D fieldtest</span>
                  <button
                    onClick={copyInstall}
                    className="cursor-pointer border-none bg-transparent p-0 text-ft-dim transition-colors hover:text-ft-text"
                    title="Copy"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ft-green-hi">
              Features
            </div>
            <h2 className="mb-4 text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15] tracking-tight text-ft-text">
              Everything your tests
              <br />
              deserve to show you.
            </h2>
            <p className="max-w-[540px] text-[17px] leading-[1.65] text-ft-mid">
              Built for the way you actually debug — by looking, not guessing.
            </p>

            <div
              className="mt-16 overflow-hidden rounded-2xl border border-white/7"
              style={{ background: "rgba(255,255,255,0.035)" }}
            >
              <div className="grid grid-cols-1 divide-y divide-white/7 md:grid-cols-2 lg:grid-cols-3 md:divide-x">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className={`p-9 transition-colors hover:bg-ft-surface ${
                      i > 0 && i % 3 !== 0 ? "" : ""
                    } ${i >= 3 ? "border-t border-white/7 md:border-t-0 lg:border-t border-white/7" : ""}`}
                  >
                    <div
                      className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border ${
                        f.color === "g"
                          ? "border-ft-green/25 bg-ft-green/12 text-ft-green-hi"
                          : "border-ft-gold/25 bg-ft-gold/12 text-ft-gold-hi"
                      }`}
                    >
                      {f.icon}
                    </div>
                    <div className="mb-2.5 text-[16px] font-bold tracking-tight text-ft-text">
                      {f.title}
                    </div>
                    <div className="text-sm leading-[1.65] text-ft-mid">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Code example */}
        <section className="border-b border-t border-white/7 bg-ft-surface px-6 py-24">
          <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ft-green-hi">
                Familiar API
              </div>
              <h2 className="mb-4 text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15] tracking-tight text-ft-text">
                If you know Jest,
                <br />
                you know fieldtest.
              </h2>
              <p className="mb-9 max-w-[480px] text-[17px] leading-[1.65] text-ft-mid">
                Same{" "}
                <code className="rounded border border-white/7 bg-ft-bg px-1.5 py-0.5 font-mono text-sm text-ft-green-hi">
                  describe / it / expect
                </code>{" "}
                you already use. Add{" "}
                <code className="rounded border border-white/7 bg-ft-bg px-1.5 py-0.5 font-mono text-sm text-ft-gold-hi">
                  snapshot()
                </code>{" "}
                where you want a visual checkpoint.
              </p>
              <div className="flex flex-col gap-6">
                {[
                  {
                    n: 1,
                    title: "Import from @fieldtest/core",
                    desc: "Drop-in for your existing test utilities. render() returns React Testing Library queries.",
                  },
                  {
                    n: 2,
                    title: "Call snapshot() anywhere",
                    desc: "Captures the DOM state at that moment. Shows up as a frame in the filmstrip.",
                  },
                  {
                    n: 3,
                    title: "Run fieldtest --ui",
                    desc: "Browser UI opens at localhost:3333. Click any test. Inspect everything.",
                  },
                ].map((p) => (
                  <div key={p.n} className="flex gap-4">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-ft-green/30 bg-ft-green/15 text-xs font-bold text-ft-green-hi">
                      {p.n}
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-ft-text">
                        {p.title}
                      </strong>
                      <span className="text-sm text-ft-mid">{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/7 bg-ft-bg">
              <div className="flex items-center gap-2.5 border-b border-white/7 bg-ft-surface px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
                  <div className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
                  <div className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-xs text-ft-dim">Button.test.tsx</span>
              </div>
              {codeHtml ? (
                <div
                  className="overflow-x-auto [&_.shiki]:!bg-transparent [&_.shiki]:p-6 [&_.shiki_code]:!text-[13px] [&_.shiki_code]:!leading-[1.75]"
                  dangerouslySetInnerHTML={{ __html: codeHtml }}
                />
              ) : (
                <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-[1.75] text-ft-mid">
                  <code>{BUTTON_TEST_CODE}</code>
                </pre>
              )}
            </div>
          </div>
        </section>

        {/* Dual mode */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ft-green-hi">
              Two modes, one test file
            </div>
            <h2 className="mb-4 text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15] tracking-tight text-ft-text">
              Browser for humans.
              <br />
              Node for machines.
            </h2>
            <p className="mb-14 max-w-[540px] text-[17px] leading-[1.65] text-ft-mid">
              The exact same test file runs in both environments. No rewrites, no separate configs.
              Use the browser UI while you build, Node in CI.
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Browser card */}
              <div className="overflow-hidden rounded-2xl border border-white/7 bg-ft-surface">
                <div className="flex items-center gap-3 border-b border-white/7 px-6 py-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-ft-green/25 bg-ft-green/12 text-ft-green-hi">
                    <BrowserIcon />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-ft-text">Browser UI</div>
                    <div className="font-mono text-xs text-ft-dim">fieldtest --ui</div>
                  </div>
                </div>
                <ul className="flex flex-col gap-3 px-6 py-5">
                  {[
                    "Filmstrip snapshots at every render step",
                    "Click any test to re-run it instantly",
                    "Per-test coverage, network, console, axe",
                    "Gallery view — all tests at a glance",
                    "Hot reload on file save",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ft-mid">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ft-green-hi" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Node card */}
              <div className="overflow-hidden rounded-2xl border border-white/7 bg-ft-surface">
                <div className="flex items-center gap-3 border-b border-white/7 px-6 py-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-ft-gold/25 bg-ft-gold/12 text-ft-gold-hi">
                    <NodeIcon />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-ft-text">Node / CI</div>
                    <div className="font-mono text-xs text-ft-dim">
                      fieldtest --coverage --shard=1/4
                    </div>
                  </div>
                </div>
                <div className="m-6 overflow-hidden rounded-xl border border-white/7 bg-ft-bg">
                  <div className="flex gap-1.5 border-b border-white/7 px-3.5 py-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-2.5 w-2.5 rounded-full bg-[#3d5a47]" />
                    ))}
                  </div>
                  <pre className="p-4 font-mono text-[12px] leading-[1.7] text-ft-mid whitespace-pre-wrap">
                    {`$ fieldtest --coverage

\x1b[32m✓\x1b[0m Button › renders label         12ms
\x1b[32m✓\x1b[0m Button › primary variant         8ms
\x1b[32m✓\x1b[0m Button › fires onClick          14ms
\x1b[31m✗\x1b[0m Button › wrong label
  Expected "Save" · Received "Submit"

─────────────────────────────────
7 passed  1 failed  42ms
Coverage: 94.2% stmts  88.6% branches`}
                  </pre>
                </div>
                <ul className="flex flex-col gap-3 px-6 pb-5">
                  {[
                    "V8 coverage → Istanbul format",
                    "Dependency-aware caching",
                    "Built-in sharding for parallel CI",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ft-mid">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ft-gold-hi" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="mb-4 text-[clamp(32px,5vw,52px)] font-black leading-[1.1] tracking-[-1.5px] text-ft-text">
              Stop guessing.
              <br />
              Start seeing.
            </h2>
            <p className="mx-auto mb-9 max-w-[460px] text-[17px] leading-relaxed text-ft-mid">
              fieldtest is open source and free. Drop it into any Vite + React project in minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/docs"
                className="flex items-center gap-2 rounded-xl bg-ft-green px-6 py-3.5 text-[15px] font-semibold text-white no-underline shadow-[0_0_24px_rgba(64,145,108,0.35)] transition-all hover:-translate-y-px hover:bg-ft-green-hi"
              >
                Get started
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="https://github.com"
                className="flex items-center gap-2 rounded-xl border border-white/7 px-6 py-3.5 text-[15px] font-medium text-ft-mid no-underline transition-all hover:-translate-y-px hover:border-white/20 hover:text-ft-text"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/7 py-8">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-6">
            <div className="flex items-center gap-2 text-sm font-bold text-ft-dim">
              <Logo size={22} id="footer" />
              fieldtest
            </div>
            <div className="text-sm text-ft-dim">Open source. MIT license.</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
