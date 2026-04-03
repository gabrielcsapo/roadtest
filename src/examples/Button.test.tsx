import { describe, it, expect, render, fireEvent } from '../framework'
import { Button } from './Button'

describe('Button', () => {
  it('renders the label', async () => {
    const { getByText } = await render(<Button label="Click me" />)
    expect(getByText('Click me')).toBeTruthy()
  })

  it('primary variant (default)', async () => {
    await render(<Button label="Primary" />)
  })

  it('secondary variant', async () => {
    await render(<Button label="Secondary" variant="secondary" />)
  })

  it('danger variant', async () => {
    await render(<Button label="Delete" variant="danger" />)
  })

  it('disabled state', async () => {
    const { getByRole } = await render(<Button label="Can't touch this" disabled />)
    const btn = getByRole('button')
    expect(btn.hasAttribute('disabled')).toBeTruthy()
  })

  it('fires onClick when clicked', async () => {
    let clicked = false
    const { getByRole } = await render(
      <Button label="Click me" onClick={() => { clicked = true }} />
    )
    await fireEvent.click(getByRole('button'))
    expect(clicked).toBe(true)
  })
})
