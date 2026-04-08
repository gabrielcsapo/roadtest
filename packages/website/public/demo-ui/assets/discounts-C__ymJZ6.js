function e() {
  var t = `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/discounts.ts`,
    n = `ea9e58108a063b353dbed8c465ec6cc01f1cf379`,
    r = globalThis,
    i = `__coverage__`,
    a = {
      path: `/Users/gabrielcsapo/Documents/test-idea/apps/example/src/discounts.ts`,
      statementMap: {
        0: { start: { line: 3, column: 1 }, end: { line: 3, column: 20 } },
        1: { start: { line: 7, column: 1 }, end: { line: 7, column: 50 } },
        2: { start: { line: 11, column: 1 }, end: { line: 11, column: 26 } },
      },
      fnMap: {
        0: {
          name: `noDiscount`,
          decl: { start: { line: 2, column: 16 }, end: { line: 2, column: 26 } },
          loc: { start: { line: 2, column: 39 }, end: { line: 4, column: 1 } },
          line: 2,
        },
        1: {
          name: `bulkDiscount`,
          decl: { start: { line: 6, column: 16 }, end: { line: 6, column: 28 } },
          loc: { start: { line: 6, column: 41 }, end: { line: 8, column: 1 } },
          line: 6,
        },
        2: {
          name: `memberDiscount`,
          decl: { start: { line: 10, column: 16 }, end: { line: 10, column: 30 } },
          loc: { start: { line: 10, column: 43 }, end: { line: 12, column: 1 } },
          line: 10,
        },
      },
      branchMap: {
        0: {
          loc: { start: { line: 7, column: 8 }, end: { line: 7, column: 49 } },
          type: `cond-expr`,
          locations: [
            { start: { line: 7, column: 19 }, end: { line: 7, column: 35 } },
            { start: { line: 7, column: 38 }, end: { line: 7, column: 49 } },
          ],
          line: 7,
        },
      },
      s: { 0: 0, 1: 0, 2: 0 },
      f: { 0: 0, 1: 0, 2: 0 },
      b: { 0: [0, 0] },
      inputSourceMap: {
        version: 3,
        names: [],
        sources: [`/Users/gabrielcsapo/Documents/test-idea/apps/example/src/discounts.ts`],
        mappings: `;AAOA,OAAO,SAAS,WAAW,OAAe,KAAqB;AAC7D,QAAO,QAAQ;;;AAIjB,OAAO,SAAS,aAAa,OAAe,KAAqB;AAC/D,QAAO,OAAO,IAAI,QAAQ,MAAM,KAAM,QAAQ;;;AAIhD,OAAO,SAAS,eAAe,OAAe,KAAqB;AACjE,QAAO,QAAQ,MAAM`,
      },
      _coverageSchema: `1a1c01bbd47fc00a2c39e90264f33305004495a9`,
      hash: `ea9e58108a063b353dbed8c465ec6cc01f1cf379`,
    },
    o = r[i] || (r[i] = {});
  (!o[t] || o[t].hash !== n) && (o[t] = a);
  var s = o[t];
  return (
    (e = function () {
      return s;
    }),
    s
  );
}
e();
function t(t, n) {
  return (e().f[0]++, e().s[0]++, t * n);
}
function n(t, n) {
  return (e().f[1]++, e().s[1]++, n >= 3 ? (e().b[0][0]++, t * n * 0.9) : (e().b[0][1]++, t * n));
}
function r(t, n) {
  return (e().f[2]++, e().s[2]++, t * n * 0.85);
}
export { n as bulkDiscount, r as memberDiscount, t as noDiscount };
//# sourceMappingURL=discounts-C__ymJZ6.js.map
