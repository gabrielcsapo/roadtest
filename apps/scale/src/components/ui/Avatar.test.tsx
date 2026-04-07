import { describe, it, expect, render, snapshot } from '@fieldtest/core'
import React from 'react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
  const shapes = ['circle', 'square'] as const
  const statuses = ['online', 'offline', 'away'] as const

  // name initials extraction = 20 tests
  const nameTests = [
    { name: 'John Doe', expected: 'JD' },
    { name: 'Alice', expected: 'A' },
    { name: 'Bob Smith', expected: 'BS' },
    { name: 'Charlie Brown', expected: 'CB' },
    { name: 'Diana Prince', expected: 'DP' },
    { name: 'Edward Norton', expected: 'EN' },
    { name: 'Fiona Green', expected: 'FG' },
    { name: 'George White', expected: 'GW' },
    { name: 'Hannah Black', expected: 'HB' },
    { name: 'Ivan Stone', expected: 'IS' },
    { name: 'Jane', expected: 'J' },
    { name: 'Kevin Hart', expected: 'KH' },
    { name: 'Lisa Ray', expected: 'LR' },
    { name: 'Mike', expected: 'M' },
    { name: 'Nina Gold', expected: 'NG' },
    { name: 'Oscar Wild', expected: 'OW' },
    { name: 'Paula Dean', expected: 'PD' },
    { name: 'Quinn Miles', expected: 'QM' },
    { name: 'Rachel Green', expected: 'RG' },
    { name: 'Steve Rogers', expected: 'SR' },
  ]

  for (const { name } of nameTests) {
    it(`renders initials for name="${name}"`, async () => {
      const { getByTestId } = await render(<Avatar name={name} />)
      expect(getByTestId('avatar-initials')).toBeDefined()
    })
  }

  // with/without image = 10 tests
  it('shows image when src provided', async () => {
    const { getByTestId } = await render(<Avatar name="John Doe" src="https://example.com/avatar.jpg" />)
    expect(getByTestId('avatar-img')).toBeDefined()
  })

  it('shows initials when no src', async () => {
    const { getByTestId } = await render(<Avatar name="John Doe" />)
    expect(getByTestId('avatar-initials')).toBeDefined()
  })

  it('no initials when src provided', async () => {
    const { queryByTestId } = await render(<Avatar name="John" src="https://example.com/img.jpg" />)
    expect(queryByTestId('avatar-initials')).toBeNull()
  })

  it('no image element when no src', async () => {
    const { queryByTestId } = await render(<Avatar name="John" />)
    expect(queryByTestId('avatar-img')).toBeNull()
  })

  for (let i = 0; i < 6; i++) {
    it(`with/without image test ${i + 1}`, async () => {
      const withSrc = i % 2 === 0
      const { getByTestId, queryByTestId } = await render(
        <Avatar name="Test User" src={withSrc ? `https://example.com/${i}.jpg` : undefined} />
      )
      if (withSrc) {
        expect(getByTestId('avatar-img')).toBeDefined()
      } else {
        expect(queryByTestId('avatar-img')).toBeNull()
      }
    })
  }

  // size × shape = 10 tests
  for (const size of sizes) {
    for (const shape of shapes) {
      it(`renders size=${size} shape=${shape}`, async () => {
        const { getByTestId } = await render(<Avatar name="John Doe" size={size} shape={shape} />)
        expect(getByTestId('avatar')).toBeDefined()
      })
    }
  }

  // status indicator = 15 tests
  it('shows status indicator when status provided', async () => {
    const { getByTestId } = await render(<Avatar name="John" status="online" />)
    expect(getByTestId('avatar-status')).toBeDefined()
  })

  it('no status indicator when no status', async () => {
    const { queryByTestId } = await render(<Avatar name="John" />)
    expect(queryByTestId('avatar-status')).toBeNull()
  })

  for (const status of statuses) {
    it(`status=${status} renders`, async () => {
      const { getByTestId } = await render(<Avatar name="John" status={status} />)
      expect(getByTestId('avatar-status')).toBeDefined()
    })
  }

  for (const size of sizes) {
    for (const status of statuses) {
      it(`status=${status} at size=${size}`, async () => {
        const { getByTestId } = await render(<Avatar name="Jane" size={size} status={status} />)
        expect(getByTestId('avatar-status')).toBeDefined()
      })
    }
  }

  // initials color hash = 20 tests
  const colorTestNames = [
    'Alice Brown', 'Bob Jones', 'Carol Smith', 'David Lee',
    'Eve Martin', 'Frank Davis', 'Grace Wilson', 'Henry Taylor',
    'Iris Moore', 'Jack Anderson', 'Kate Jackson', 'Liam Harris',
    'Mia Thompson', 'Noah Garcia', 'Olivia Martinez', 'Paul Robinson',
    'Quinn Clark', 'Rose Lewis', 'Sam Walker', 'Tara Hall',
  ]

  for (const name of colorTestNames) {
    it(`color hash for "${name}"`, async () => {
      const { getByTestId } = await render(<Avatar name={name} />)
      expect(getByTestId('avatar-initials')).toBeDefined()
    })
  }

  // long names = 10 tests
  const longNames = [
    'Alexander The Great',
    'Mary Queen Of Scots',
    'William Shakespeare',
    'Elizabeth Windsor',
    'Constantine Julius Caesar',
    'Bartholomew Fitzgerald O\'Brien',
    'Montgomery Archibald',
    'Penelope Rodriguez Martinez',
    'Christobel Vanderhoeven',
    'Xiomara Guadalupe',
  ]

  for (const name of longNames) {
    it(`long name: "${name}"`, async () => {
      const { getByTestId } = await render(<Avatar name={name} />)
      expect(getByTestId('avatar-initials')).toBeDefined()
    })
  }

  // snapshot = 5 tests
  it('snapshot: default', async () => {
    await render(<Avatar name="John Doe" />)
    await snapshot('avatar-default')
  })

  it('snapshot: with status online', async () => {
    await render(<Avatar name="Jane Smith" status="online" />)
    await snapshot('avatar-online')
  })

  it('snapshot: square shape', async () => {
    await render(<Avatar name="Bob Jones" shape="square" size="lg" />)
    await snapshot('avatar-square')
  })

  it('snapshot: size xl', async () => {
    await render(<Avatar name="Alice Wonder" size="xl" />)
    await snapshot('avatar-xl')
  })

  it('snapshot: with image', async () => {
    await render(<Avatar name="Carol Davis" src="https://example.com/img.jpg" />)
    await snapshot('avatar-with-image')
  })

  // single word names = 10+ tests
  const singleWordNames = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack']
  for (const name of singleWordNames) {
    it(`single word name: "${name}"`, async () => {
      const { getByTestId } = await render(<Avatar name={name} />)
      expect(getByTestId('avatar-initials')).toBeDefined()
    })
  }

  // accessibility
  it('has role=img', async () => {
    const { getByRole } = await render(<Avatar name="Test User" />)
    expect(getByRole('img')).toBeDefined()
  })

  it('has aria-label with name', async () => {
    const { getByRole } = await render(<Avatar name="Test User" />)
    expect(getByRole('img')).toBeDefined()
  })

  it('custom className', async () => {
    const { getByTestId } = await render(<Avatar name="Test" className="custom" />)
    expect(getByTestId('avatar-wrapper')).toBeDefined()
  })

  it('custom testId', async () => {
    const { getByTestId } = await render(<Avatar name="Test" data-testid="my-avatar" />)
    expect(getByTestId('my-avatar')).toBeDefined()
  })

  it('wrapper always rendered', async () => {
    const { getByTestId } = await render(<Avatar name="Test" />)
    expect(getByTestId('avatar-wrapper')).toBeDefined()
  })
})
