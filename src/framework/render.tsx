import type { ReactElement } from 'react'
import { currentTest } from './store'

/** Cached module reference — import once, call render() fresh each time */
let _mod: typeof import('@testing-library/react') | null = null

async function getTL() {
  if (!_mod) _mod = await import('@testing-library/react')
  return _mod
}

/**
 * render() is the key primitive — it does two things at once:
 *
 * 1. Captures the ReactElement onto the current test so the UI can display it
 *    as a "story" in the preview panel.
 * 2. Returns @testing-library/react utilities so you can query and assert on it.
 *
 * Works in Node (with happy-dom) and in the browser.
 */
export async function render(element: ReactElement) {
  if (currentTest) {
    currentTest.element = element
  }

  const { render: tlRender } = await getTL()
  return tlRender(element)
}

type TLFireEvent = typeof import('@testing-library/react').fireEvent
type AsyncFireEvent = {
  (element: Element | Node | Document | Window, event: Event): Promise<boolean>
} & {
  [K in keyof TLFireEvent]: TLFireEvent[K] extends (el: infer E, init?: infer I) => boolean
    ? (el: E, init?: I) => Promise<boolean>
    : never
}

/**
 * fireEvent and act are re-exported from @testing-library/react so tests
 * don't need a direct dependency on it. Use fireEvent (not raw .click())
 * when you need to trigger events that cause React state updates.
 */
async function _fireEvent(element: Element | Node | Document | Window, event: Event) {
  const { fireEvent: fe } = await getTL()
  return fe(element, event)
}

const eventMethods = [
  'click', 'dblClick', 'change', 'input', 'submit', 'focus', 'blur',
  'keyDown', 'keyUp', 'keyPress', 'mouseDown', 'mouseUp', 'mouseEnter',
  'mouseLeave', 'mouseOver', 'mouseOut', 'scroll', 'contextMenu',
] as const

for (const method of eventMethods) {
  ;(_fireEvent as unknown as Record<string, unknown>)[method] = async (
    element: Element,
    eventProperties?: object
  ) => {
    const { fireEvent: fe } = await getTL()
    return (fe[method] as (el: Element, props?: object) => boolean)(element, eventProperties)
  }
}

export const fireEvent = _fireEvent as AsyncFireEvent

export async function act(fn: () => void | Promise<void>) {
  const { act: tlAct } = await getTL()
  return tlAct(fn)
}
