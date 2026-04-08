import { useState, useMemo, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import Nav from "../components/Nav";
import { DocDemo } from "../components/UiDemos";
import { docs, categories, type DocEntry } from "../data/docs";
import { getHighlighter, highlight as shikiHighlight } from "../lib/highlighter";
import type { Highlighter } from "shiki";

// ── Minimal markdown → HTML renderer ────────────────────────────────────────
function renderMarkdown(md: string, highlighter: Highlighter | null): string {
  let html = md.trim();

  // Fenced code blocks — use Shiki when available, plain fallback while loading
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const trimmed = code.trimEnd();
    if (highlighter) {
      return shikiHighlight(highlighter, trimmed, lang || "text");
    }
    const escaped = trimmed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre><code>${escaped}</code></pre>`;
  });

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");

  // Blockquote
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered list
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Tables (must run before inline code/bold to avoid mangling pipes)
  html = html.replace(
    /^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm,
    (_match, header, body) => {
      const cols = header
        .split("|")
        .map((h: string) => h.trim())
        .filter(Boolean);
      const thead = `<thead><tr>${cols.map((c: string) => `<th>${c}</th>`).join("")}</tr></thead>`;
      const tbody = body
        .trim()
        .split("\n")
        .map((row: string) => {
          const cells = row
            .split("|")
            .map((c: string) => c.trim())
            .filter(Boolean);
          return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join("")}</tr>`;
        })
        .join("");
      return `<table>${thead}<tbody>${tbody}</tbody></table>`;
    },
  );

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs
  const lines = html.split("\n");
  const result: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      inBlock = false;
      continue;
    }
    if (/^<(h[123]|pre|ul|ol|li|blockquote|hr|div)/.test(trimmed)) {
      inBlock = false;
      result.push(trimmed);
    } else if (!inBlock) {
      result.push(`<p>${trimmed}`);
      inBlock = true;
    } else {
      result[result.length - 1] += " " + trimmed;
    }
  }

  return result
    .map((l) => (l.startsWith("<p>") && !l.endsWith("</p>") ? l + "</p>" : l))
    .join("\n");
}

// ── Search input ──────────────────────────────────────────────────────────────
function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ft-dim"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search docs…"
        className="w-full rounded-lg border border-white/7 bg-ft-bg py-2 pl-9 pr-3 font-sans text-sm text-ft-text placeholder:text-ft-dim focus:border-ft-green/50 focus:outline-none focus:ring-1 focus:ring-ft-green/30 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ft-dim hover:text-ft-mid transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Highlight matching text ───────────────────────────────────────────────────
function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    '<mark class="bg-ft-gold/30 text-ft-gold-hi rounded px-0.5">$1</mark>',
  );
}

// ── Shared highlighter — loaded once, shared across all sections ──────────────
let _highlighter: Highlighter | null = null;
getHighlighter().then((h) => {
  _highlighter = h;
});

// ── Doc section ───────────────────────────────────────────────────────────────
function DocSection({ doc, query }: { doc: DocEntry; query: string }) {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(_highlighter);

  useEffect(() => {
    if (_highlighter) {
      setHighlighter(_highlighter);
      return;
    }
    getHighlighter().then((h) => {
      _highlighter = h;
      setHighlighter(h);
    });
  }, []);

  const html = useMemo(() => renderMarkdown(doc.body, highlighter), [doc.body, highlighter]);
  const highlighted = useMemo(() => {
    if (!query.trim()) return html;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return html.replace(
      new RegExp(`(${escaped})`, "gi"),
      '<mark class="bg-ft-gold/30 text-ft-gold-hi rounded px-0.5">$1</mark>',
    );
  }, [html, query]);

  return (
    <article id={doc.id} className="border-b border-white/7 py-10 scroll-mt-[80px]">
      <div className="doc-prose" dangerouslySetInnerHTML={{ __html: highlighted }} />
      {doc.demo && <DocDemo id={doc.demo} />}
    </article>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Docs() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(() => {
    return window.location.hash.slice(1) || docs[0].id;
  });
  const mainRef = useRef<HTMLDivElement>(null);
  const scrollPendingRef = useRef(false);

  const fuse = useMemo(
    () =>
      new Fuse(docs, {
        keys: [
          { name: "title", weight: 3 },
          { name: "category", weight: 1 },
          { name: "body", weight: 1 },
        ],
        threshold: 0.35,
        includeScore: true,
        minMatchCharLength: 2,
      }),
    [],
  );

  const filtered = useMemo<DocEntry[]>(
    () => (query.trim().length >= 2 ? fuse.search(query).map((r) => r.item) : docs),
    [fuse, query],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, DocEntry[]>();
    for (const cat of categories) map.set(cat, []);
    for (const doc of filtered) map.get(doc.category)?.push(doc);
    return map;
  }, [filtered]);

  // Scroll to hash on initial load
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: "start" });
    }
  }, []);

  // Sync hash → activeId when user navigates back/forward
  useEffect(() => {
    function onHashChange() {
      const id = window.location.hash.slice(1);
      if (id) setActiveId(id);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Track active section on scroll via IntersectionObserver
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollPendingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveId(id);
            history.replaceState(null, "", `#${id}`);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    main.querySelectorAll("article[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filtered]);

  function scrollTo(id: string) {
    scrollPendingRef.current = true;
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Re-enable observer after scroll settles
    setTimeout(() => {
      scrollPendingRef.current = false;
    }, 800);
  }

  return (
    <div className="flex min-h-screen flex-col bg-ft-bg font-sans text-ft-text">
      <Nav />

      <div className="mx-auto flex w-full max-w-[1100px] flex-1 gap-0 px-0">
        {/* Sidebar */}
        <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-[260px] flex-shrink-0 overflow-y-auto border-r border-white/7 px-4 py-6 lg:block">
          <SearchInput value={query} onChange={setQuery} />

          <nav className="mt-6 space-y-5">
            {categories.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ft-dim">
                    {cat}
                  </div>
                  {items.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => scrollTo(doc.id)}
                      className={`block w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition-colors border-none bg-transparent ${
                        activeId === doc.id
                          ? "bg-ft-green/15 font-medium text-ft-green-hi"
                          : "text-ft-mid hover:bg-white/5 hover:text-ft-text"
                      }`}
                      dangerouslySetInnerHTML={{ __html: highlight(doc.title, query) }}
                    />
                  ))}
                </div>
              );
            })}
          </nav>

          {filtered.length === 0 && (
            <p className="mt-4 px-2 text-sm text-ft-dim">No results for "{query}"</p>
          )}
        </aside>

        {/* Content */}
        <main ref={mainRef} className="min-w-0 flex-1 px-8 py-8 lg:px-12">
          {/* Mobile search */}
          <div className="mb-6 lg:hidden">
            <SearchInput value={query} onChange={setQuery} />
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mb-3 text-4xl">🔍</div>
              <p className="text-ft-mid">
                No docs matched <strong className="text-ft-text">"{query}"</strong>
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-4 cursor-pointer rounded-lg border border-white/7 bg-transparent px-4 py-2 text-sm text-ft-mid hover:text-ft-text transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((doc) => <DocSection key={doc.id} doc={doc} query={query} />)
          )}
        </main>
      </div>
    </div>
  );
}
