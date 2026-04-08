import { createHighlighter, type HighlighterGeneric } from "shiki";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Highlighter = HighlighterGeneric<any, any>;

let _promise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!_promise) {
    _promise = createHighlighter({
      themes: ["one-dark-pro"],
      langs: ["typescript", "tsx", "jsx", "javascript", "bash", "shell", "json"],
    });
  }
  return _promise;
}

export function highlight(highlighter: Highlighter, code: string, lang: string): string {
  const safeLang = highlighter.getLoadedLanguages().includes(lang as never) ? lang : "text";
  return highlighter.codeToHtml(code, { lang: safeLang, theme: "one-dark-pro" });
}
