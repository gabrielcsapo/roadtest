import { _ as e, d as t, f as n, h as r, l as i, p as a } from "./src-bHa7jhTB.js";
e(`./greeting`, () => ({ getGreeting: (e) => `Good morning, ${e}!` }));
var { getGreeting: o } = await r(`./greeting`, () =>
  i(() => import(`./greeting-CuXn23LT.js`), [], import.meta.url),
);
n(`getGreeting() — mocked`, () => {
  (a(`returns the mocked greeting`, () => {
    t(o(`Alice`)).toBe(`Good morning, Alice!`);
  }),
    a(`passes the name through the mock`, () => {
      t(o(`Bob`)).toBe(`Good morning, Bob!`);
    }));
});
//# sourceMappingURL=greeting.test-BWJ6_R3y.js.map
