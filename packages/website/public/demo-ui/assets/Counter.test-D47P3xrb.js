import { r as e } from "./chunk-DECur_0Z.js";
import { c as t, d as n, f as r, o as i, p as a, s as o } from "./src-bHa7jhTB.js";
import { t as s } from "./react-BpVXNi5D.js";
import { t as c } from "./jsx-runtime-BSbMHKsn.js";
var l = e(s(), 1),
  u = c();
function d() {
  var e = `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/Counter.tsx`,
    t = `9f68e145ebd6eaec3cdd45649b956586a093a718`,
    n = globalThis,
    r = `__coverage__`,
    i = {
      path: `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/Counter.tsx`,
      statementMap: {
        0: { start: { line: 4, column: 27 }, end: { line: 4, column: 44 } },
        1: { start: { line: 5, column: 1 }, end: { line: 37, column: 4 } },
        2: { start: { line: 14, column: 19 }, end: { line: 14, column: 44 } },
        3: { start: { line: 14, column: 35 }, end: { line: 14, column: 43 } },
        4: { start: { line: 31, column: 19 }, end: { line: 31, column: 44 } },
        5: { start: { line: 31, column: 35 }, end: { line: 31, column: 43 } },
        6: { start: { line: 39, column: 17 }, end: { line: 49, column: 1 } },
      },
      fnMap: {
        0: {
          name: `Counter`,
          decl: { start: { line: 3, column: 16 }, end: { line: 3, column: 23 } },
          loc: { start: { line: 3, column: 51 }, end: { line: 38, column: 1 } },
          line: 3,
        },
        1: {
          name: `(anonymous_1)`,
          decl: { start: { line: 14, column: 13 }, end: { line: 14, column: 14 } },
          loc: { start: { line: 14, column: 19 }, end: { line: 14, column: 44 } },
          line: 14,
        },
        2: {
          name: `(anonymous_2)`,
          decl: { start: { line: 14, column: 28 }, end: { line: 14, column: 29 } },
          loc: { start: { line: 14, column: 35 }, end: { line: 14, column: 43 } },
          line: 14,
        },
        3: {
          name: `(anonymous_3)`,
          decl: { start: { line: 31, column: 13 }, end: { line: 31, column: 14 } },
          loc: { start: { line: 31, column: 19 }, end: { line: 31, column: 44 } },
          line: 31,
        },
        4: {
          name: `(anonymous_4)`,
          decl: { start: { line: 31, column: 28 }, end: { line: 31, column: 29 } },
          loc: { start: { line: 31, column: 35 }, end: { line: 31, column: 43 } },
          line: 31,
        },
      },
      branchMap: {
        0: {
          loc: { start: { line: 3, column: 26 }, end: { line: 3, column: 37 } },
          type: `default-arg`,
          locations: [{ start: { line: 3, column: 36 }, end: { line: 3, column: 37 } }],
          line: 3,
        },
        1: {
          loc: { start: { line: 3, column: 39 }, end: { line: 3, column: 47 } },
          type: `default-arg`,
          locations: [{ start: { line: 3, column: 46 }, end: { line: 3, column: 47 } }],
          line: 3,
        },
      },
      s: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      f: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
      b: { 0: [0], 1: [0] },
      inputSourceMap: {
        version: 3,
        names: [],
        sources: [`/Users/gabrielcsapo/Documents/test-idea/apps/example/src/Counter.tsx`],
        mappings: `AAAA,SAAS,gBAAgB;;AAOzB,OAAO,SAAS,QAAQ,EAAE,UAAU,GAAG,OAAO,KAAmB;CAC/D,MAAM,CAAC,OAAO,YAAY,SAAS,QAAQ;AAE3C,QACE,sBAAC,OAAD;EAAK,OAAO;GAAE,SAAS;GAAQ,YAAY;GAAU,KAAK;GAAI,YAAY;GAAc;YAAxF;GACE,qBAAC,UAAD;IACE,eAAe,UAAS,MAAK,IAAI,KAAK;IACtC,OAAO;IACP,cAAW;cACZ;IAAU;GACX,qBAAC,QAAD;IACE,eAAY;IACZ,OAAO;KAAE,UAAU;KAAI,YAAY;KAAK,UAAU;KAAI,WAAW;KAAU,OAAO;KAAW;cAE5F;IACI;GACP,qBAAC,UAAD;IACE,eAAe,UAAS,MAAK,IAAI,KAAK;IACtC,OAAO;IACP,cAAW;cACZ;IAAU;GACP;;;AAIV,MAAM,WAAgC;CACpC,OAAO;CAAI,QAAQ;CAAI,cAAc;CACrC,QAAQ;CAAQ,YAAY;CAAW,OAAO;CAC9C,UAAU;CAAI,YAAY;CAAK,QAAQ;CACxC`,
      },
      _coverageSchema: `1a1c01bbd47fc00a2c39e90264f33305004495a9`,
      hash: `9f68e145ebd6eaec3cdd45649b956586a093a718`,
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
function f({ initial: e = (d().b[0][0]++, 0), step: t = (d().b[1][0]++, 1) }) {
  d().f[0]++;
  let [n, r] = (d().s[0]++, (0, l.useState)(e));
  return (
    d().s[1]++,
    (0, u.jsxs)(`div`, {
      style: { display: `flex`, alignItems: `center`, gap: 12, fontFamily: `sans-serif` },
      children: [
        (0, u.jsx)(`button`, {
          onClick: () => (d().f[1]++, d().s[2]++, r((e) => (d().f[2]++, d().s[3]++, e - t))),
          style: p,
          "aria-label": `decrement`,
          children: `−`,
        }),
        (0, u.jsx)(`span`, {
          "data-testid": `count`,
          style: {
            fontSize: 28,
            fontWeight: 700,
            minWidth: 48,
            textAlign: `center`,
            color: `#e2e2e8`,
          },
          children: n,
        }),
        (0, u.jsx)(`button`, {
          onClick: () => (d().f[3]++, d().s[4]++, r((e) => (d().f[4]++, d().s[5]++, e + t))),
          style: p,
          "aria-label": `increment`,
          children: `+`,
        }),
      ],
    })
  );
}
var p =
  (d().s[6]++,
  {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `none`,
    background: `#6366f1`,
    color: `#fff`,
    fontSize: 20,
    fontWeight: 700,
    cursor: `pointer`,
  });
r(`Counter`, () => {
  (a(`starts at zero`, async () => {
    let { getByTestId: e } = await o((0, u.jsx)(f, {}));
    n(e(`count`).textContent).toBe(`0`);
  }),
    a(`starts at a custom initial value`, async () => {
      let { getByTestId: e } = await o((0, u.jsx)(f, { initial: 10 }));
      n(e(`count`).textContent).toBe(`10`);
    }),
    a(`increments on + click`, async () => {
      let { getByTestId: e, getByLabelText: t } = await o((0, u.jsx)(f, {}));
      (await i.click(t(`increment`)), n(e(`count`).textContent).toBe(`1`));
    }),
    a(`decrements on − click`, async () => {
      let { getByTestId: e, getByLabelText: t } = await o((0, u.jsx)(f, { initial: 5 }));
      (await i.click(t(`decrement`)), n(e(`count`).textContent).toBe(`4`));
    }),
    a(`respects custom step`, async () => {
      await o((0, u.jsx)(f, { initial: 0, step: 5 }));
    }),
    a(`increment timeline`, async () => {
      let { getByLabelText: e } = await o((0, u.jsx)(f, {}));
      (await t(`start`),
        await i.click(e(`increment`)),
        await t(`+1`),
        await i.click(e(`increment`)),
        await t(`+2`),
        await i.click(e(`increment`)),
        await t(`+3`));
    }));
});
//# sourceMappingURL=Counter.test-D47P3xrb.js.map
