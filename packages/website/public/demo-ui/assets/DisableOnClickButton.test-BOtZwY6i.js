import { r as e } from "./chunk-DECur_0Z.js";
import { c as t, d as n, f as r, o as i, p as a, s as o } from "./src-bHa7jhTB.js";
import { t as s } from "./react-BpVXNi5D.js";
import { t as c } from "./jsx-runtime-BSbMHKsn.js";
var l = e(s(), 1),
  u = c();
function d() {
  var e = `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/DisableOnClickButton.tsx`,
    t = `714d6cecb0d196d25400abdb069fa03adcd77fb9`,
    n = globalThis,
    r = `__coverage__`,
    i = {
      path: `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/DisableOnClickButton.tsx`,
      statementMap: {
        0: { start: { line: 4, column: 33 }, end: { line: 4, column: 48 } },
        1: { start: { line: 5, column: 1 }, end: { line: 20, column: 4 } },
        2: { start: { line: 7, column: 17 }, end: { line: 7, column: 34 } },
      },
      fnMap: {
        0: {
          name: `DisableOnClickButton`,
          decl: { start: { line: 3, column: 16 }, end: { line: 3, column: 36 } },
          loc: { start: { line: 3, column: 61 }, end: { line: 21, column: 1 } },
          line: 3,
        },
        1: {
          name: `(anonymous_1)`,
          decl: { start: { line: 7, column: 11 }, end: { line: 7, column: 12 } },
          loc: { start: { line: 7, column: 17 }, end: { line: 7, column: 34 } },
          line: 7,
        },
      },
      branchMap: {
        0: {
          loc: { start: { line: 3, column: 39 }, end: { line: 3, column: 57 } },
          type: `default-arg`,
          locations: [{ start: { line: 3, column: 47 }, end: { line: 3, column: 57 } }],
          line: 3,
        },
        1: {
          loc: { start: { line: 12, column: 15 }, end: { line: 12, column: 47 } },
          type: `cond-expr`,
          locations: [
            { start: { line: 12, column: 26 }, end: { line: 12, column: 35 } },
            { start: { line: 12, column: 38 }, end: { line: 12, column: 47 } },
          ],
          line: 12,
        },
        2: {
          loc: { start: { line: 13, column: 10 }, end: { line: 13, column: 39 } },
          type: `cond-expr`,
          locations: [
            { start: { line: 13, column: 21 }, end: { line: 13, column: 30 } },
            { start: { line: 13, column: 33 }, end: { line: 13, column: 39 } },
          ],
          line: 13,
        },
        3: {
          loc: { start: { line: 16, column: 11 }, end: { line: 16, column: 47 } },
          type: `cond-expr`,
          locations: [
            { start: { line: 16, column: 22 }, end: { line: 16, column: 35 } },
            { start: { line: 16, column: 38 }, end: { line: 16, column: 47 } },
          ],
          line: 16,
        },
        4: {
          loc: { start: { line: 19, column: 12 }, end: { line: 19, column: 41 } },
          type: `cond-expr`,
          locations: [
            { start: { line: 19, column: 23 }, end: { line: 19, column: 33 } },
            { start: { line: 19, column: 36 }, end: { line: 19, column: 41 } },
          ],
          line: 19,
        },
      },
      s: { 0: 0, 1: 0, 2: 0 },
      f: { 0: 0, 1: 0 },
      b: { 0: [0], 1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0] },
      inputSourceMap: {
        version: 3,
        names: [],
        sources: [
          `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/DisableOnClickButton.tsx`,
        ],
        mappings: `AAAA,SAAS,gBAAgB;;AAEzB,OAAO,SAAS,qBAAqB,EAAE,QAAQ,cAAkC;CAC/E,MAAM,CAAC,UAAU,eAAe,SAAS,MAAM;AAE/C,QACE,qBAAC,UAAD;EACY;EACV,eAAe,YAAY,KAAK;EAChC,OAAO;GACL,SAAS;GAAY,cAAc;GAAG,QAAQ;GAC9C,YAAY,WAAW,YAAY;GACnC,OAAO,WAAW,YAAY;GAC9B,UAAU;GAAI,YAAY;GAC1B,QAAQ,WAAW,gBAAgB;GACnC,YAAY;GACb;YAEA,WAAW,aAAa;EAClB`,
      },
      _coverageSchema: `1a1c01bbd47fc00a2c39e90264f33305004495a9`,
      hash: `714d6cecb0d196d25400abdb069fa03adcd77fb9`,
    },
    a = n[r] || (n[r] = {});
  (!a[e] || a[e].hash !== t) && (a[e] = i);
  var o = a[e];
  return (
    (d = function () {
      return o;
    }),
    o
  );
}
d();
function f({ label: e = (d().b[0][0]++, `Click me`) }) {
  d().f[0]++;
  let [t, n] = (d().s[0]++, (0, l.useState)(!1));
  return (
    d().s[1]++,
    (0, u.jsx)(`button`, {
      disabled: t,
      onClick: () => (d().f[1]++, d().s[2]++, n(!0)),
      style: {
        padding: `8px 20px`,
        borderRadius: 8,
        border: `none`,
        background: t ? (d().b[1][0]++, `#374151`) : (d().b[1][1]++, `#6366f1`),
        color: t ? (d().b[2][0]++, `#6b7280`) : (d().b[2][1]++, `#fff`),
        fontSize: 14,
        fontWeight: 600,
        cursor: t ? (d().b[3][0]++, `not-allowed`) : (d().b[3][1]++, `pointer`),
        transition: `background 0.15s, color 0.15s`,
      },
      children: t ? (d().b[4][0]++, `Disabled`) : (d().b[4][1]++, e),
    })
  );
}
r(`DisableOnClickButton`, () => {
  a(`disables itself after click`, async () => {
    let { getByRole: e } = await o((0, u.jsx)(f, { label: `Submit` }));
    (await t(`before click`),
      await i.click(e(`button`)),
      await t(`after click`),
      n(e(`button`).hasAttribute(`disabled`)).toBe(!0));
  });
});
//# sourceMappingURL=DisableOnClickButton.test-BOtZwY6i.js.map
