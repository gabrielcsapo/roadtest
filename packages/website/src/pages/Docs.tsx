import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Fuse from "fuse.js";
import Nav from "../components/Nav";
import { docs, categories, type DocEntry } from "../data/docs";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TocHeading {
  level: number;
  text: string;
  id: string;
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

// ── Highlight matching text in sidebar titles ─────────────────────────────────
function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    '<mark class="bg-ft-gold/30 text-ft-gold-hi rounded px-0.5">$1</mark>',
  );
}

// ── Table of contents ─────────────────────────────────────────────────────────
function TableOfContents({
  headings,
  activeTocId,
  onClickHeading,
}: {
  headings: TocHeading[];
  activeTocId: string;
  onClickHeading: (id: string) => void;
}) {
  if (headings.length === 0) return null;
  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ft-dim">
        On this page
      </div>
      <nav className="space-y-0.5">
        {headings.map((h) => (
          <button
            key={h.id}
            onClick={() => onClickHeading(h.id)}
            className={`block w-full cursor-pointer border-none bg-transparent text-left transition-colors rounded py-[5px] leading-snug ${
              h.level === 3 ? "pl-3 text-[11.5px]" : "pl-0 text-[12px]"
            } ${
              activeTocId === h.id
                ? "text-ft-green-hi font-medium"
                : "text-ft-dim hover:text-ft-mid"
            }`}
          >
            {h.text}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Prev / Next navigation ────────────────────────────────────────────────────
function PrevNextNav({ prev, next }: { prev: DocEntry | null; next: DocEntry | null }) {
  return (
    <div className="mt-12 flex items-start justify-between border-t border-white/7 pt-8 gap-4">
      {prev ? (
        <Link
          to={`/docs/${prev.id}`}
          className="group flex items-center gap-3 no-underline text-ft-mid hover:text-ft-text transition-colors min-w-0"
        >
          <svg
            className="shrink-0"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-ft-dim mb-0.5">Previous</div>
            <div className="text-sm font-medium text-ft-text group-hover:text-ft-green-hi transition-colors truncate">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`/docs/${next.id}`}
          className="group flex items-center gap-3 no-underline text-ft-mid hover:text-ft-text transition-colors text-right min-w-0"
        >
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-ft-dim mb-0.5">Next</div>
            <div className="text-sm font-medium text-ft-text group-hover:text-ft-green-hi transition-colors truncate">
              {next.title}
            </div>
          </div>
          <svg
            className="shrink-0"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Docs() {
  const { docId } = useParams<{ docId: string }>();
  const [query, setQuery] = useState("");
  const [activeTocId, setActiveTocId] = useState("");
  const [tocHeadings, setTocHeadings] = useState<TocHeading[]>([]);
  const mainRef = useRef<HTMLDivElement>(null);

  const currentIndex = docs.findIndex((d) => d.id === docId);
  const currentDoc = currentIndex !== -1 ? docs[currentIndex] : null;
  const prevDoc = currentIndex > 0 ? docs[currentIndex - 1] : null;
  const nextDoc = currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null;

  if (!currentDoc) return <Navigate to="/docs/installation" replace />;

  const fuse = useMemo(
    () =>
      new Fuse(docs, {
        keys: [
          { name: "title", weight: 3 },
          { name: "category", weight: 1 },
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

  // Scroll to top and reset TOC on page change
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setActiveTocId("");
  }, [docId]);

  // Extract TOC headings from the rendered doc
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    // Small delay to let MDX render
    const id = requestAnimationFrame(() => {
      const nodes = Array.from(main.querySelectorAll<HTMLElement>("h2[id], h3[id]"));
      setTocHeadings(
        nodes.map((el) => ({
          level: el.tagName === "H2" ? 2 : 3,
          text: el.textContent ?? "",
          id: el.id,
        })),
      );
    });
    return () => cancelAnimationFrame(id);
  }, [docId]);

  // Track active heading for TOC scroll-spy
  useEffect(() => {
    const main = mainRef.current;
    if (!main || tocHeadings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id);
          }
        }
      },
      { rootMargin: "-8% 0px -82% 0px", threshold: 0 },
    );
    main.querySelectorAll("h2[id], h3[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [docId, tocHeadings]);

  function scrollToHeading(id: string) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveTocId(id);
  }

  return (
    <div className="flex min-h-screen flex-col bg-ft-bg font-sans text-ft-text">
      <Nav />

      <div className="mx-auto flex w-full max-w-[1100px] xl:max-w-[1340px] flex-1 gap-0 px-0">
        {/* Left sidebar — doc navigation */}
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
                    <Link
                      key={doc.id}
                      to={`/docs/${doc.id}`}
                      className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition-colors no-underline ${
                        docId === doc.id
                          ? "bg-ft-green/15 font-medium text-ft-green-hi"
                          : "text-ft-mid hover:bg-white/5 hover:text-ft-text"
                      }`}
                    >
                      <span dangerouslySetInnerHTML={{ __html: highlight(doc.title, query) }} />
                    </Link>
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

          <article className="doc-prose">
            <currentDoc.Component />
          </article>

          <PrevNextNav prev={prevDoc} next={nextDoc} />
        </main>

        {/* Right sidebar — table of contents, xl screens only */}
        <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-[200px] flex-shrink-0 overflow-y-auto border-l border-white/7 px-5 py-8 xl:block">
          <TableOfContents
            headings={tocHeadings}
            activeTocId={activeTocId}
            onClickHeading={scrollToHeading}
          />
        </aside>
      </div>
    </div>
  );
}
