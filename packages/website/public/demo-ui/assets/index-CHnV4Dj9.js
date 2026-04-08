const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./Button.test-NytTWzMV.js",
      "./src-bHa7jhTB.js",
      "./chunk-DECur_0Z.js",
      "./axe-CftruGSC.js",
      "./client-DsoX8Bqk.js",
      "./react-BpVXNi5D.js",
      "./jsx-runtime-BSbMHKsn.js",
      "./Button-BbqBrU3W.js",
      "./Card.test-Dv8xaDUR.js",
      "./Card-Bc0IYsp9.js",
      "./Counter.test-D47P3xrb.js",
      "./DisableOnClickButton.test-BOtZwY6i.js",
      "./TaskBoard.test-C3aoXZ2M.js",
      "./UserProfile.test-DXLUBQvK.js",
      "./setup-BPUuYb5b.js",
      "./isCommonAssetRequest-Cr39sXTT.js",
      "./core-B1yr4Vn1.js",
      "./discounts.test-cP7UmMf8.js",
      "./greeting.test-BWJ6_R3y.js",
      "./logic.test-C0zsDkFL.js",
    ]),
) => i.map((i) => d[i]);
import { l as e, t } from "./src-bHa7jhTB.js";
import { t as n } from "./jsx-runtime-BSbMHKsn.js";
import "./setup-BPUuYb5b.js";
(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes) e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === `use-credentials`
        ? (t.credentials = `include`)
        : e.crossOrigin === `anonymous`
          ? (t.credentials = `omit`)
          : (t.credentials = `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
var r = n();
function i({ children: e }) {
  return (0, r.jsx)(`div`, { style: { fontFamily: `inherit`, color: `inherit` }, children: e });
}
await t(
  Object.assign({
    "./src/Button.test.tsx": () =>
      e(
        () => import(`./Button.test-NytTWzMV.js`),
        __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7]),
        import.meta.url,
      ),
    "./src/Card.test.tsx": () =>
      e(
        () => import(`./Card.test-Dv8xaDUR.js`),
        __vite__mapDeps([8, 1, 2, 3, 4, 5, 6, 9, 7]),
        import.meta.url,
      ),
    "./src/Counter.test.tsx": () =>
      e(
        () => import(`./Counter.test-D47P3xrb.js`),
        __vite__mapDeps([10, 2, 1, 3, 4, 5, 6]),
        import.meta.url,
      ),
    "./src/DisableOnClickButton.test.tsx": () =>
      e(
        () => import(`./DisableOnClickButton.test-BOtZwY6i.js`),
        __vite__mapDeps([11, 2, 1, 3, 4, 5, 6]),
        import.meta.url,
      ),
    "./src/TaskBoard.test.tsx": () =>
      e(
        () => import(`./TaskBoard.test-C3aoXZ2M.js`),
        __vite__mapDeps([12, 2, 1, 3, 4, 5, 6, 7, 9]),
        import.meta.url,
      ),
    "./src/UserProfile.test.tsx": () =>
      e(
        () => import(`./UserProfile.test-DXLUBQvK.js`),
        __vite__mapDeps([13, 2, 1, 3, 4, 5, 6, 14, 15, 16]),
        import.meta.url,
      ),
    "./src/discounts.test.ts": () =>
      e(
        () => import(`./discounts.test-cP7UmMf8.js`),
        __vite__mapDeps([17, 1, 2, 3, 4, 5, 6]),
        import.meta.url,
      ),
    "./src/greeting.test.ts": () =>
      e(
        () => import(`./greeting.test-BWJ6_R3y.js`),
        __vite__mapDeps([18, 1, 2, 3, 4, 5, 6]),
        import.meta.url,
      ),
    "./src/logic.test.ts": () =>
      e(
        () => import(`./logic.test-C0zsDkFL.js`),
        __vite__mapDeps([19, 1, 2, 3, 4, 5, 6]),
        import.meta.url,
      ),
  }),
  { wrapper: i },
);
//# sourceMappingURL=index-CHnV4Dj9.js.map
