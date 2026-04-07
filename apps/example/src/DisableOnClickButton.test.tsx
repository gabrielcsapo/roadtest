import { describe, it, expect, render, fireEvent, snapshot } from '@fieldtest/core'
import { DisableOnClickButton } from './DisableOnClickButton'

describe('DisableOnClickButton', () => {
  it('disables itself after click', async () => {
    const { getByRole } = await render(<DisableOnClickButton label="Submit" />)

    await snapshot('before click')

    await fireEvent.click(getByRole('button'))

    await snapshot('after click')

    expect(getByRole('button').hasAttribute('disabled')).toBe(true)
  })
})
