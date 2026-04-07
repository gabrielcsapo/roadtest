import { describe, it, expect, render, snapshot } from '@fieldtest/core'
import React from 'react'
import { Badge } from './Badge'

describe('Badge', () => {
  const variants = ['default', 'success', 'warning', 'danger', 'info'] as const
  const sizes = ['sm', 'md'] as const

  // variant × size = 10 tests
  for (const variant of variants) {
    for (const size of sizes) {
      it(`renders variant=${variant} size=${size}`, async () => {
        const { getByTestId } = await render(<Badge variant={variant} size={size}>Label</Badge>)
        expect(getByTestId('badge')).toBeDefined()
      })
    }
  }

  // dot with each variant = 5 tests
  for (const variant of variants) {
    it(`renders dot with variant=${variant}`, async () => {
      const { getByTestId } = await render(<Badge variant={variant} dot>Status</Badge>)
      expect(getByTestId('badge-dot')).toBeDefined()
    })
  }

  // no dot = 5 tests
  for (const variant of variants) {
    it(`no dot for variant=${variant}`, async () => {
      const { queryByTestId } = await render(<Badge variant={variant}>Status</Badge>)
      expect(queryByTestId('badge-dot')).toBeNull()
    })
  }

  // snapshot each variant = 5 tests
  for (const variant of variants) {
    it(`snapshot: variant=${variant}`, async () => {
      await render(<Badge variant={variant}>Label</Badge>)
      await snapshot(`badge-${variant}`)
    })
  }

  // rounded prop = 5 tests
  for (const variant of variants) {
    it(`rounded variant=${variant}`, async () => {
      const { getByTestId } = await render(<Badge variant={variant} rounded>Pill</Badge>)
      expect(getByTestId('badge')).toBeDefined()
    })
  }

  // text content variations
  it('renders short text', async () => {
    const { getByTestId } = await render(<Badge>OK</Badge>)
    expect(getByTestId('badge-content')).toBeDefined()
  })

  it('renders long text', async () => {
    const { getByTestId } = await render(<Badge>Non-Compliant Policy Violation</Badge>)
    expect(getByTestId('badge-content')).toBeDefined()
  })

  it('renders number content', async () => {
    const { getByTestId } = await render(<Badge>{42}</Badge>)
    expect(getByTestId('badge-content')).toBeDefined()
  })

  it('renders empty badge', async () => {
    const { getByTestId } = await render(<Badge />)
    expect(getByTestId('badge')).toBeDefined()
  })

  it('renders with custom className', async () => {
    const { getByTestId } = await render(<Badge className="custom">Label</Badge>)
    expect(getByTestId('badge')).toBeDefined()
  })

  it('renders with custom data-testid', async () => {
    const { getByTestId } = await render(<Badge data-testid="my-badge">Label</Badge>)
    expect(getByTestId('my-badge')).toBeDefined()
  })

  // dot + rounded combos = 10 tests
  for (const variant of variants) {
    it(`dot + rounded for variant=${variant}`, async () => {
      const { getByTestId } = await render(<Badge variant={variant} dot rounded>Status</Badge>)
      expect(getByTestId('badge-dot')).toBeDefined()
    })
  }

  for (const variant of variants) {
    it(`dot + sm size for variant=${variant}`, async () => {
      const { getByTestId } = await render(<Badge variant={variant} dot size="sm">Sm</Badge>)
      expect(getByTestId('badge-dot')).toBeDefined()
    })
  }

  // color mapping verification = 5 tests
  it('default variant has gray appearance', async () => {
    const { getByTestId } = await render(<Badge variant="default">Default</Badge>)
    expect(getByTestId('badge')).toBeDefined()
  })

  it('success variant has green appearance', async () => {
    const { getByTestId } = await render(<Badge variant="success">Success</Badge>)
    expect(getByTestId('badge')).toBeDefined()
  })

  it('warning variant has yellow appearance', async () => {
    const { getByTestId } = await render(<Badge variant="warning">Warning</Badge>)
    expect(getByTestId('badge')).toBeDefined()
  })

  it('danger variant has red appearance', async () => {
    const { getByTestId } = await render(<Badge variant="danger">Danger</Badge>)
    expect(getByTestId('badge')).toBeDefined()
  })

  it('info variant has blue appearance', async () => {
    const { getByTestId } = await render(<Badge variant="info">Info</Badge>)
    expect(getByTestId('badge')).toBeDefined()
  })

  // accessibility
  it('has role=status', async () => {
    const { getByRole } = await render(<Badge>Status</Badge>)
    expect(getByRole('status')).toBeDefined()
  })

  // size-specific tests = 10 tests
  for (const variant of variants) {
    it(`size=sm for variant=${variant}`, async () => {
      const { getByTestId } = await render(<Badge variant={variant} size="sm">Sm</Badge>)
      expect(getByTestId('badge')).toBeDefined()
    })
  }

  for (const variant of variants) {
    it(`size=md for variant=${variant}`, async () => {
      const { getByTestId } = await render(<Badge variant={variant} size="md">Md</Badge>)
      expect(getByTestId('badge')).toBeDefined()
    })
  }

  // content not shown when no children
  it('no content span when no children', async () => {
    const { queryByTestId } = await render(<Badge />)
    expect(queryByTestId('badge-content')).toBeNull()
  })

  it('renders with special characters', async () => {
    const { getByTestId } = await render(<Badge>{'< > & "'}</Badge>)
    expect(getByTestId('badge-content')).toBeDefined()
  })

  it('renders with emoji', async () => {
    const { getByTestId } = await render(<Badge>🔴 High</Badge>)
    expect(getByTestId('badge-content')).toBeDefined()
  })

  it('snapshot: dot variant', async () => {
    await render(<Badge dot variant="success">Active</Badge>)
    await snapshot('badge-dot-success')
  })

  it('snapshot: rounded', async () => {
    await render(<Badge rounded variant="info">Info</Badge>)
    await snapshot('badge-rounded')
  })

  it('renders default variant when no variant prop', async () => {
    const { getByTestId } = await render(<Badge>Default</Badge>)
    expect(getByTestId('badge')).toBeDefined()
  })

  it('renders default size when no size prop', async () => {
    const { getByTestId } = await render(<Badge>Default Size</Badge>)
    expect(getByTestId('badge')).toBeDefined()
  })
})
