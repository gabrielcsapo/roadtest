import { describe, it, expect, render, fireEvent } from '@fieldtest/core'
import { Card } from './Card'

describe('Card', () => {
  it('renders title and description', async () => {
    const { getByTestId } = await render(
      <Card title="Hello" description="World" />
    )
    expect(getByTestId('card-title').textContent).toBe('Hello')
    expect(getByTestId('card-description').textContent).toBe('World')
  })

  it('renders action button and fires callback', async () => {
    let fired = false
    const { getByRole } = await render(
      <Card
        title="Delete item"
        description="This cannot be undone."
        actionLabel="Confirm"
        onAction={() => { fired = true }}
        variant="danger"
      />
    )
    await fireEvent.click(getByRole('button'))
    expect(fired).toBe(true)
  })

  it('shows danger variant styles', async () => {
    await render(
      <Card title="Warning" description="Danger ahead." actionLabel="Delete" variant="danger" />
    )
  })

  it('renders without an action button', async () => {
    const { getByTestId } = await render(
      <Card title="Info" description="No action needed." />
    )
    expect(getByTestId('card').textContent?.includes('Info')).toBe(true)
  })
})
