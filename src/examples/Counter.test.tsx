import { describe, it, expect, render, fireEvent } from '../framework'
import { Counter } from './Counter'

describe('Counter', () => {
  it('starts at zero', async () => {
    const { getByTestId } = await render(<Counter />)
    expect(getByTestId('count').textContent).toBe('0')
  })

  it('starts at a custom initial value', async () => {
    const { getByTestId } = await render(<Counter initial={10} />)
    expect(getByTestId('count').textContent).toBe('10')
  })

  it('increments on + click', async () => {
    const { getByTestId, getByLabelText } = await render(<Counter />)
    await fireEvent.click(getByLabelText('increment'))
    expect(getByTestId('count').textContent).toBe('1')
  })

  it('decrements on − click', async () => {
    const { getByTestId, getByLabelText } = await render(<Counter initial={5} />)
    await fireEvent.click(getByLabelText('decrement'))
    expect(getByTestId('count').textContent).toBe('4')
  })

  it('respects custom step', async () => {
    await render(<Counter initial={0} step={5} />)
  })
})
