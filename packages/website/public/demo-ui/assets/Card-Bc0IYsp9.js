import { t as e } from "./jsx-runtime-BSbMHKsn.js";
import { t } from "./Button-BbqBrU3W.js";
var n = e();
function r() {
  var e = `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/Card.tsx`,
    t = `7b3a40a14eedb1933c3007804f04ac690a815923`,
    n = globalThis,
    i = `__coverage__`,
    a = {
      path: `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/Card.tsx`,
      statementMap: { 0: { start: { line: 4, column: 1 }, end: { line: 44, column: 4 } } },
      fnMap: {
        0: {
          name: `Card`,
          decl: { start: { line: 3, column: 16 }, end: { line: 3, column: 20 } },
          loc: { start: { line: 3, column: 89 }, end: { line: 45, column: 1 } },
          line: 3,
        },
      },
      branchMap: {
        0: {
          loc: { start: { line: 3, column: 66 }, end: { line: 3, column: 85 } },
          type: `default-arg`,
          locations: [{ start: { line: 3, column: 76 }, end: { line: 3, column: 85 } }],
          line: 3,
        },
        1: {
          loc: { start: { line: 8, column: 24 }, end: { line: 8, column: 80 } },
          type: `cond-expr`,
          locations: [
            { start: { line: 8, column: 47 }, end: { line: 8, column: 68 } },
            { start: { line: 8, column: 71 }, end: { line: 8, column: 80 } },
          ],
          line: 8,
        },
        2: {
          loc: { start: { line: 38, column: 3 }, end: { line: 42, column: 8 } },
          type: `binary-expr`,
          locations: [
            { start: { line: 38, column: 3 }, end: { line: 38, column: 14 } },
            { start: { line: 38, column: 34 }, end: { line: 42, column: 8 } },
          ],
          line: 38,
        },
        3: {
          loc: { start: { line: 40, column: 13 }, end: { line: 40, column: 56 } },
          type: `cond-expr`,
          locations: [
            { start: { line: 40, column: 36 }, end: { line: 40, column: 44 } },
            { start: { line: 40, column: 47 }, end: { line: 40, column: 56 } },
          ],
          line: 40,
        },
      },
      s: { 0: 0 },
      f: { 0: 0 },
      b: { 0: [0], 1: [0, 0], 2: [0, 0], 3: [0, 0] },
      inputSourceMap: {
        version: 3,
        names: [],
        sources: [`/Users/gabrielcsapo/Documents/test-idea/apps/example/src/Card.tsx`],
        mappings: `AAAA,SAAS,cAAc;;AAUvB,OAAO,SAAS,KAAK,EAAE,OAAO,aAAa,aAAa,UAAU,UAAU,aAAwB;AAClG,QACE,sBAAC,OAAD;EACE,eAAY;EACZ,OAAO;GACL,YAAY;GACZ,QAAQ,aAAa,YAAY,WAAW,wBAAwB;GACpE,cAAc;GACd,SAAS;GACT,SAAS;GACT,eAAe;GACf,KAAK;GACL,UAAU;GACX;YAXH;GAYC;GAEC,qBAAC,MAAD;IAAI,eAAY;IAAa,OAAO;KAAE,OAAO;KAAW,UAAU;KAAI,YAAY;KAAK,QAAQ;KAAG;cAC/F;IACE;GACL,qBAAC,KAAD;IAAG,eAAY;IAAmB,OAAO;KAAE,OAAO;KAAW,UAAU;KAAI,QAAQ;KAAG,YAAY;KAAK;cACpG;IACC;GACH,eACC,qBAAC,OAAD,YACE,qBAAC,QAAD;IACE,OAAO;IACP,SAAS,YAAY,WAAW,WAAW;IAC3C,SAAS;IACT,GACE;GAEJ`,
      },
      _coverageSchema: `1a1c01bbd47fc00a2c39e90264f33305004495a9`,
      hash: `7b3a40a14eedb1933c3007804f04ac690a815923`,
    },
    o = n[i] || (n[i] = {});
  (!o[e] || o[e].hash !== t) && (o[e] = a);
  var s = o[e];
  return (
    (r = function () {
      return s;
    }),
    s
  );
}
r();
function i({
  title: e,
  description: i,
  actionLabel: a,
  onAction: o,
  variant: s = (r().b[0][0]++, `default`),
}) {
  return (
    r().f[0]++,
    r().s[0]++,
    (0, n.jsxs)(`div`, {
      "data-testid": `card`,
      style: {
        background: `#1a1a24`,
        border: `1px solid ${s === `danger` ? (r().b[1][0]++, `rgba(239,68,68,0.3)`) : (r().b[1][1]++, `#2a2a36`)}`,
        borderRadius: 12,
        padding: 20,
        display: `flex`,
        flexDirection: `column`,
        gap: 12,
        maxWidth: 320,
      },
      children: [
        `hu`,
        (0, n.jsx)(`h3`, {
          "data-testid": `card-title`,
          style: { color: `#e2e2e8`, fontSize: 16, fontWeight: 700, margin: 0 },
          children: e,
        }),
        (0, n.jsx)(`p`, {
          "data-testid": `card-description`,
          style: { color: `#6b7280`, fontSize: 13, margin: 0, lineHeight: 1.5 },
          children: i,
        }),
        (r().b[2][0]++, a) &&
          (r().b[2][1]++,
          (0, n.jsx)(`div`, {
            children: (0, n.jsx)(t, {
              label: a,
              variant: s === `danger` ? (r().b[3][0]++, `danger`) : (r().b[3][1]++, `primary`),
              onClick: o,
            }),
          })),
      ],
    })
  );
}
export { i as t };
//# sourceMappingURL=Card-Bc0IYsp9.js.map
