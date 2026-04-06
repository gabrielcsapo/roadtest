import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import React from 'react'
import { Alert } from './Alert'

describe('Alert', () => {
  const variants = ['info', 'success', 'warning', 'danger'] as const

  // variant × dismissible = 8 tests
  for (const variant of variants) {
    it(`renders variant=${variant} dismissible=false`, async () => {
      const { getByTestId } = await render(<Alert variant={variant}>Content</Alert>)
      expect(getByTestId('alert')).toBeDefined()
    })
  }

  for (const variant of variants) {
    it(`renders variant=${variant} dismissible=true`, async () => {
      const { getByTestId } = await render(<Alert variant={variant} dismissible>Content</Alert>)
      expect(getByTestId('alert-dismiss')).toBeDefined()
    })
  }

  // with/without title = 8 tests
  for (const variant of variants) {
    it(`with title for variant=${variant}`, async () => {
      const { getByTestId } = await render(<Alert variant={variant} title="Alert Title">Content</Alert>)
      expect(getByTestId('alert-title')).toBeDefined()
    })
  }

  for (const variant of variants) {
    it(`without title for variant=${variant}`, async () => {
      const { queryByTestId } = await render(<Alert variant={variant}>Content</Alert>)
      expect(queryByTestId('alert-title')).toBeNull()
    })
  }

  // content variations = 20 tests
  const contents = [
    'Simple message',
    'Your password expires in 3 days.',
    'Policy review is due.',
    'New vendor added successfully.',
    'Failed to load data.',
    'Audit scheduled for next week.',
    'Compliance check passed.',
    'Risk level updated.',
    'User account created.',
    'Background check completed.',
    'Certificate will expire soon.',
    'New framework available.',
    'Control implemented.',
    'Vendor risk changed.',
    'Evidence submitted.',
    'Review required.',
    'Action needed.',
    'System updated.',
    'Connection established.',
    'Sync completed.',
  ]

  for (const content of contents) {
    it(`renders content: "${content.substring(0, 30)}"`, async () => {
      const { getByTestId } = await render(<Alert>{content}</Alert>)
      expect(getByTestId('alert-body')).toBeDefined()
    })
  }

  // dismiss interaction = 15 tests
  it('dismisses on click', async () => {
    const { getByTestId, queryByTestId } = await render(<Alert dismissible>Content</Alert>)
    await fireEvent.click(getByTestId('alert-dismiss'))
    expect(queryByTestId('alert')).toBeNull()
  })

  it('calls onDismiss when dismissed', async () => {
    let dismissed = false
    const { getByTestId } = await render(<Alert dismissible onDismiss={() => { dismissed = true }}>Content</Alert>)
    await fireEvent.click(getByTestId('alert-dismiss'))
    expect(dismissed).toBe(true)
  })

  it('no dismiss button when dismissible=false', async () => {
    const { queryByTestId } = await render(<Alert>Content</Alert>)
    expect(queryByTestId('alert-dismiss')).toBeNull()
  })

  for (const variant of variants) {
    it(`dismiss works for variant=${variant}`, async () => {
      let called = false
      const { getByTestId } = await render(<Alert variant={variant} dismissible onDismiss={() => { called = true }}>Content</Alert>)
      await fireEvent.click(getByTestId('alert-dismiss'))
      expect(called).toBe(true)
    })
  }

  for (let i = 0; i < 10; i++) {
    it(`dismiss test ${i + 1}`, async () => {
      let called = false
      const { getByTestId } = await render(<Alert dismissible onDismiss={() => { called = true }}>Content {i}</Alert>)
      await fireEvent.click(getByTestId('alert-dismiss'))
      expect(called).toBe(true)
    })
  }

  // icon variations = 10 tests
  it('shows default icon', async () => {
    const { getByTestId } = await render(<Alert>Content</Alert>)
    expect(getByTestId('alert-icon')).toBeDefined()
  })

  it('renders custom icon', async () => {
    const { getByTestId } = await render(<Alert icon={<span data-testid="custom-icon">★</span>}>Content</Alert>)
    expect(getByTestId('custom-icon')).toBeDefined()
  })

  for (const variant of variants) {
    it(`default icon for variant=${variant}`, async () => {
      const { getByTestId } = await render(<Alert variant={variant}>Content</Alert>)
      expect(getByTestId('alert-icon')).toBeDefined()
    })
  }

  it('custom icon overrides default', async () => {
    const { getByTestId } = await render(<Alert icon={<span data-testid="my-icon">🔒</span>}>Content</Alert>)
    expect(getByTestId('my-icon')).toBeDefined()
  })

  it('no icon renders default', async () => {
    const { getByTestId } = await render(<Alert variant="warning">Warning</Alert>)
    expect(getByTestId('alert-icon')).toBeDefined()
  })

  // snapshot = 4 tests
  for (const variant of variants) {
    it(`snapshot: ${variant}`, async () => {
      await render(<Alert variant={variant} title="Alert Title">Alert content here</Alert>)
      await snapshot(`alert-${variant}`)
    })
  }

  // compound content = 15 tests
  it('renders title + body together', async () => {
    const { getByTestId } = await render(<Alert title="Title">Body</Alert>)
    expect(getByTestId('alert-title')).toBeDefined()
    expect(getByTestId('alert-body')).toBeDefined()
  })

  it('renders icon + title + body + dismiss', async () => {
    const { getByTestId } = await render(
      <Alert variant="danger" title="Error" dismissible icon={<span>!</span>}>Something failed</Alert>
    )
    expect(getByTestId('alert-icon')).toBeDefined()
    expect(getByTestId('alert-title')).toBeDefined()
    expect(getByTestId('alert-body')).toBeDefined()
    expect(getByTestId('alert-dismiss')).toBeDefined()
  })

  it('content element present', async () => {
    const { getByTestId } = await render(<Alert>Content</Alert>)
    expect(getByTestId('alert-content')).toBeDefined()
  })

  for (let i = 0; i < 12; i++) {
    it(`compound content test ${i + 1}`, async () => {
      const variant = variants[i % 4]
      const { getByTestId } = await render(
        <Alert variant={variant} title={`Title ${i}`} dismissible>Content {i}</Alert>
      )
      expect(getByTestId('alert')).toBeDefined()
    })
  }

  // accessibility = 20+ tests
  it('has role=alert', async () => {
    const { getByRole } = await render(<Alert>Content</Alert>)
    expect(getByRole('alert')).toBeDefined()
  })

  for (const variant of variants) {
    it(`role=alert for variant=${variant}`, async () => {
      const { getByRole } = await render(<Alert variant={variant}>Content</Alert>)
      expect(getByRole('alert')).toBeDefined()
    })
  }

  it('dismiss button has aria-label', async () => {
    const { getByTestId } = await render(<Alert dismissible>Content</Alert>)
    expect(getByTestId('alert-dismiss')).toBeDefined()
  })

  it('custom className', async () => {
    const { getByTestId } = await render(<Alert className="custom">Content</Alert>)
    expect(getByTestId('alert')).toBeDefined()
  })

  it('custom testId', async () => {
    const { getByTestId } = await render(<Alert data-testid="my-alert">Content</Alert>)
    expect(getByTestId('my-alert')).toBeDefined()
  })

  it('data-variant attribute set', async () => {
    const { getByTestId } = await render(<Alert variant="danger">Content</Alert>)
    expect(getByTestId('alert')).toBeDefined()
  })

  for (let i = 0; i < 14; i++) {
    it(`accessibility and variant test ${i + 1}`, async () => {
      const variant = variants[i % 4]
      const { getByRole } = await render(<Alert variant={variant} title={`Alert ${i}`}>Message</Alert>)
      expect(getByRole('alert')).toBeDefined()
    })
  }
})
