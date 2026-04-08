import { d as e, f as t, o as n, p as r, s as i } from "./src-bHa7jhTB.js";
import { t as a } from "./jsx-runtime-BSbMHKsn.js";
import { t as o } from "./Button-BbqBrU3W.js";
var s = a();
t(`Button`, () => {
  (r(`renders the label`, async () => {
    let { getByText: t } = await i((0, s.jsx)(o, { label: `Click me` }));
    e(t(`Click me`)).toBeTruthy();
  }),
    r(`primary variant (default)`, async () => {
      await i((0, s.jsx)(o, { label: `Primary` }));
    }),
    r(`secondary variant`, async () => {
      await i((0, s.jsx)(o, { label: `Secondary`, variant: `secondary` }));
    }),
    r(`danger variant`, async () => {
      await i((0, s.jsx)(o, { label: `Delete`, variant: `danger` }));
    }),
    r(`disabled state`, async () => {
      let { getByRole: t } = await i((0, s.jsx)(o, { label: `Can't touch this`, disabled: !0 }));
      e(t(`button`).hasAttribute(`disabled`)).toBeTruthy();
    }),
    r(`fires onClick when clicked`, async () => {
      let t = !1,
        { getByRole: r } = await i(
          (0, s.jsx)(o, {
            label: `Click me`,
            onClick: () => {
              t = !0;
            },
          }),
        );
      (await n.click(r(`button`)), e(t).toBe(!0));
    }),
    r(`wrong label`, async () => {
      let { getByRole: t } = await i((0, s.jsx)(o, { label: `Submit` }));
      e(t(`button`).textContent).toBe(`Save`);
    }),
    r(`all variants`, async () => {
      (await i((0, s.jsx)(o, { label: `Primary` })),
        await i((0, s.jsx)(o, { label: `Secondary`, variant: `secondary` })),
        await i((0, s.jsx)(o, { label: `Danger`, variant: `danger` })),
        await i((0, s.jsx)(o, { label: `Disabled`, disabled: !0 })));
    }));
});
//# sourceMappingURL=Button.test-NytTWzMV.js.map
