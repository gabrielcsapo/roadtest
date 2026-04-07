import { describe, it, expect, render, fireEvent } from '@fieldtest/core'
import React from 'react'
import { useForm } from './useForm'

interface TestFormValues {
  name: string
  email: string
  message: string
  age: number
  agree: boolean
}

const defaultValues: TestFormValues = {
  name: '',
  email: '',
  message: '',
  age: 0,
  agree: false,
}

function validator(values: TestFormValues) {
  const errors: Record<string, string> = {}
  if (!values.name.trim()) errors.name = 'Name is required'
  if (!values.email.includes('@')) errors.email = 'Invalid email'
  return errors
}

function FormHarness({ initialValues = defaultValues, withValidator = false }: { initialValues?: TestFormValues; withValidator?: boolean }) {
  const { values, errors, touched, isValid, isDirty, isSubmitting, setValue, setValues, setError, clearError, touch, touchAll, reset, handleSubmit } = useForm<TestFormValues>(
    initialValues,
    withValidator ? validator : undefined
  )

  let submitResult = ''
  const onSubmit = handleSubmit(vals => { submitResult = vals.name })

  return (
    <div>
      <span data-testid="name">{values.name}</span>
      <span data-testid="email">{values.email}</span>
      <span data-testid="message">{values.message}</span>
      <span data-testid="age">{String(values.age)}</span>
      <span data-testid="agree">{String(values.agree)}</span>
      <span data-testid="error-name">{errors.name ?? ''}</span>
      <span data-testid="error-email">{errors.email ?? ''}</span>
      <span data-testid="touched-name">{String(touched.name ?? false)}</span>
      <span data-testid="touched-email">{String(touched.email ?? false)}</span>
      <span data-testid="isValid">{String(isValid)}</span>
      <span data-testid="isDirty">{String(isDirty)}</span>
      <span data-testid="isSubmitting">{String(isSubmitting)}</span>
      <span data-testid="submitResult">{submitResult}</span>

      <button data-testid="set-name-alice" onClick={() => setValue('name', 'Alice')}>set name Alice</button>
      <button data-testid="set-name-bob" onClick={() => setValue('name', 'Bob')}>set name Bob</button>
      <button data-testid="set-name-empty" onClick={() => setValue('name', '')}>set name empty</button>
      <button data-testid="set-email-valid" onClick={() => setValue('email', 'user@example.com')}>set email valid</button>
      <button data-testid="set-email-invalid" onClick={() => setValue('email', 'notanemail')}>set email invalid</button>
      <button data-testid="set-message" onClick={() => setValue('message', 'Hello world')}>set message</button>
      <button data-testid="set-age-25" onClick={() => setValue('age', 25)}>set age 25</button>
      <button data-testid="set-agree-true" onClick={() => setValue('agree', true)}>set agree true</button>

      <button data-testid="set-values" onClick={() => setValues({ name: 'Charlie', email: 'charlie@example.com' })}>set values</button>

      <button data-testid="set-error-name" onClick={() => setError('name', 'Custom error')}>set error name</button>
      <button data-testid="clear-error-name" onClick={() => clearError('name')}>clear error name</button>

      <button data-testid="touch-name" onClick={() => touch('name')}>touch name</button>
      <button data-testid="touch-email" onClick={() => touch('email')}>touch email</button>
      <button data-testid="touch-all" onClick={touchAll}>touch all</button>

      <button data-testid="reset" onClick={reset}>reset</button>
      <button data-testid="submit" onClick={onSubmit}>submit</button>
    </div>
  )
}

describe('useForm', () => {
  describe('initial state with default values', () => {
    it('name is empty initially', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('name').textContent).toBe('')
    })

    it('email is empty initially', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('email').textContent).toBe('')
    })

    it('message is empty initially', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('message').textContent).toBe('')
    })

    it('age is 0 initially', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('age').textContent).toBe('0')
    })

    it('agree is false initially', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('agree').textContent).toBe('false')
    })

    it('no errors initially (no validator)', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('error-name').textContent).toBe('')
    })

    it('not touched initially', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('touched-name').textContent).toBe('false')
    })

    it('isValid is true initially (no validator)', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('isValid').textContent).toBe('true')
    })

    it('isDirty is false initially', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('isDirty').textContent).toBe('false')
    })

    it('isSubmitting is false initially', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('isSubmitting').textContent).toBe('false')
    })
  })

  describe('initial state with custom initial values', () => {
    const customInitials: TestFormValues[] = [
      { name: 'Alice', email: 'alice@example.com', message: 'Hello', age: 30, agree: true },
      { name: 'Bob', email: 'bob@example.com', message: '', age: 25, agree: false },
      { name: '', email: '', message: 'Initial message', age: 18, agree: false },
      { name: 'Charlie', email: '', message: '', age: 0, agree: true },
      { name: 'Diana', email: 'diana@test.com', message: 'Test', age: 45, agree: true },
    ]
    for (const init of customInitials) {
      it(`initializes with name="${init.name}"`, async () => {
        const { getByTestId } = await render(<FormHarness initialValues={init} />)
        expect(getByTestId('name').textContent).toBe(init.name)
      })
    }
    for (const init of customInitials) {
      it(`initializes with email="${init.email}"`, async () => {
        const { getByTestId } = await render(<FormHarness initialValues={init} />)
        expect(getByTestId('email').textContent).toBe(init.email)
      })
    }
  })

  describe('setValue', () => {
    it('setValue name to Alice', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-name-alice'))
      expect(getByTestId('name').textContent).toBe('Alice')
    })

    it('setValue name to Bob', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-name-bob'))
      expect(getByTestId('name').textContent).toBe('Bob')
    })

    it('setValue email to valid', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-email-valid'))
      expect(getByTestId('email').textContent).toBe('user@example.com')
    })

    it('setValue message', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-message'))
      expect(getByTestId('message').textContent).toBe('Hello world')
    })

    it('setValue age to 25', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-age-25'))
      expect(getByTestId('age').textContent).toBe('25')
    })

    it('setValue agree to true', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-agree-true'))
      expect(getByTestId('agree').textContent).toBe('true')
    })

    it('isDirty becomes true after setValue', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-name-alice'))
      expect(getByTestId('isDirty').textContent).toBe('true')
    })

    it('setValue back to initial makes isDirty false', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-name-alice'))
      await fireEvent.click(getByTestId('set-name-empty'))
      expect(getByTestId('isDirty').textContent).toBe('false')
    })

    const setNameCases = [
      { btn: 'set-name-alice', expected: 'Alice' },
      { btn: 'set-name-bob', expected: 'Bob' },
    ]
    for (const c of setNameCases) {
      it(`setName via ${c.btn} updates to "${c.expected}"`, async () => {
        const { getByTestId } = await render(<FormHarness />)
        await fireEvent.click(getByTestId(c.btn))
        expect(getByTestId('name').textContent).toBe(c.expected)
      })
    }
  })

  describe('setValues', () => {
    it('setValues updates multiple fields', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-values'))
      expect(getByTestId('name').textContent).toBe('Charlie')
      expect(getByTestId('email').textContent).toBe('charlie@example.com')
    })
  })

  describe('errors', () => {
    it('setError sets custom error', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-error-name'))
      expect(getByTestId('error-name').textContent).toBe('Custom error')
    })

    it('clearError removes error', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-error-name'))
      await fireEvent.click(getByTestId('clear-error-name'))
      expect(getByTestId('error-name').textContent).toBe('')
    })

    it('with validator: invalid email sets error', async () => {
      const { getByTestId } = await render(<FormHarness withValidator />)
      await fireEvent.click(getByTestId('set-email-invalid'))
      expect(getByTestId('error-email').textContent).toBe('Invalid email')
    })

    it('with validator: valid email clears email error', async () => {
      const { getByTestId } = await render(<FormHarness withValidator />)
      await fireEvent.click(getByTestId('set-email-valid'))
      expect(getByTestId('error-email').textContent).toBe('')
    })

    it('with validator: isValid is false when there are errors', async () => {
      const { getByTestId } = await render(<FormHarness withValidator />)
      // empty name and email both invalid
      expect(getByTestId('isValid').textContent).toBe('false')
    })

    it('with validator: isValid is true when all valid', async () => {
      const { getByTestId } = await render(<FormHarness withValidator />)
      await fireEvent.click(getByTestId('set-name-alice'))
      await fireEvent.click(getByTestId('set-email-valid'))
      expect(getByTestId('isValid').textContent).toBe('true')
    })
  })

  describe('touch', () => {
    it('touch name marks it as touched', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('touch-name'))
      expect(getByTestId('touched-name').textContent).toBe('true')
    })

    it('touch email marks it as touched', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('touch-email'))
      expect(getByTestId('touched-email').textContent).toBe('true')
    })

    it('touchAll marks all fields', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('touch-all'))
      expect(getByTestId('touched-name').textContent).toBe('true')
      expect(getByTestId('touched-email').textContent).toBe('true')
    })

    it('touching once is idempotent', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('touch-name'))
      await fireEvent.click(getByTestId('touch-name'))
      expect(getByTestId('touched-name').textContent).toBe('true')
    })
  })

  describe('reset', () => {
    it('reset clears name', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-name-alice'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('name').textContent).toBe('')
    })

    it('reset clears isDirty', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-name-alice'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('isDirty').textContent).toBe('false')
    })

    it('reset clears touched', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('touch-name'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('touched-name').textContent).toBe('false')
    })

    it('reset clears errors', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-error-name'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('error-name').textContent).toBe('')
    })

    it('can use form again after reset', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-name-alice'))
      await fireEvent.click(getByTestId('reset'))
      await fireEvent.click(getByTestId('set-name-bob'))
      expect(getByTestId('name').textContent).toBe('Bob')
    })
  })

  describe('edge cases', () => {
    it('isValid element exists', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('isValid')).toBeDefined()
    })

    it('isDirty element exists', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('isDirty')).toBeDefined()
    })

    it('isSubmitting element exists', async () => {
      const { getByTestId } = await render(<FormHarness />)
      expect(getByTestId('isSubmitting')).toBeDefined()
    })

    it('multiple setValue calls update correctly', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-name-alice'))
      await fireEvent.click(getByTestId('set-name-bob'))
      expect(getByTestId('name').textContent).toBe('Bob')
    })

    it('setValues partial does not erase other fields', async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId('set-age-25'))
      await fireEvent.click(getByTestId('set-values'))
      expect(getByTestId('age').textContent).toBe('25')
    })
  })
})

describe('useForm - setting name field with various values', () => {
  const nameCases = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
    'Kevin', 'Laura', 'Michael', 'Nancy', 'Oscar', 'Patricia', 'Quinn', 'Rachel', 'Steve', 'Teresa',
  ]
  for (const name of nameCases) {
    it(`setValue name="${name}" shows in name field`, async () => {
      function NameHarness() {
        const { values, setValue } = useForm<TestFormValues>(defaultValues)
        return (
          <div>
            <span data-testid="name">{values.name}</span>
            <button data-testid="set" onClick={() => setValue('name', name)}>set</button>
          </div>
        )
      }
      const { getByTestId } = await render(<NameHarness />)
      await fireEvent.click(getByTestId('set'))
      expect(getByTestId('name').textContent).toBe(name)
    })
  }
})

describe('useForm - isDirty after mutations', () => {
  const dirtyCases = [
    { label: 'set name to Alice', op: 'set-name-alice', expected: 'true' },
    { label: 'set email valid', op: 'set-email-valid', expected: 'true' },
    { label: 'set message', op: 'set-message', expected: 'true' },
    { label: 'set age 25', op: 'set-age-25', expected: 'true' },
    { label: 'set agree true', op: 'set-agree-true', expected: 'true' },
    { label: 'set name empty', op: 'set-name-empty', expected: 'false' },
  ]
  for (const c of dirtyCases) {
    it(`isDirty=${c.expected} after ${c.label}`, async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId(c.op))
      expect(getByTestId('isDirty').textContent).toBe(c.expected)
    })
  }
})

describe('useForm - touched fields', () => {
  const touchCases = [
    { label: 'touch name', op: 'touch-name', testid: 'touched-name', expected: 'true' },
    { label: 'touch email', op: 'touch-email', testid: 'touched-email', expected: 'true' },
  ]
  for (const c of touchCases) {
    it(`${c.label} => touched=${c.expected}`, async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId(c.op))
      expect(getByTestId(c.testid).textContent).toBe(c.expected)
    })
  }
})

describe('useForm - reset functionality', () => {
  const resetCases = [
    { op: 'set-name-alice', field: 'name', expected: '' },
    { op: 'set-email-valid', field: 'email', expected: '' },
    { op: 'set-message', field: 'message', expected: '' },
    { op: 'set-age-25', field: 'age', expected: '0' },
    { op: 'set-agree-true', field: 'agree', expected: 'false' },
  ]
  for (const c of resetCases) {
    it(`after ${c.op} then reset, ${c.field}="${c.expected}"`, async () => {
      const { getByTestId } = await render(<FormHarness />)
      await fireEvent.click(getByTestId(c.op))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId(c.field).textContent).toBe(c.expected)
    })
  }
})

describe('useForm - error management', () => {
  const errorCases = [
    { label: 'set name error', op: 'set-error-name', testid: 'error-name', expected: 'Required' },
    { label: 'set email error', op: 'set-error-email', testid: 'error-email', expected: 'Invalid' },
    { label: 'set and clear name error', ops: ['set-error-name', 'clear-error-name'], testid: 'error-name', expected: '' },
    { label: 'set and clear email error', ops: ['set-error-email', 'clear-error-email'], testid: 'error-email', expected: '' },
  ]
  for (const c of errorCases) {
    it(c.label, async () => {
      const { getByTestId } = await render(<FormHarness />)
      if (c.op) {
        await fireEvent.click(getByTestId(c.op))
      } else if (c.ops) {
        for (const op of c.ops) {
          await fireEvent.click(getByTestId(op))
        }
      }
      expect(getByTestId(c.testid).textContent).toBe(c.expected)
    })
  }
})

describe('useForm - isValid with validator', () => {
  it('isValid is false with empty name (validator)', async () => {
    const { getByTestId } = await render(<FormHarness withValidator />)
    await fireEvent.click(getByTestId('validate'))
    expect(getByTestId('isValid').textContent).toBe('false')
  })

  it('isValid is true after setting valid name and email', async () => {
    const { getByTestId } = await render(<FormHarness withValidator />)
    await fireEvent.click(getByTestId('set-name-alice'))
    await fireEvent.click(getByTestId('set-email-valid'))
    await fireEvent.click(getByTestId('validate'))
    expect(getByTestId('isValid').textContent).toBe('true')
  })

  it('isValid is false with valid name but invalid email', async () => {
    const { getByTestId } = await render(<FormHarness withValidator />)
    await fireEvent.click(getByTestId('set-name-alice'))
    await fireEvent.click(getByTestId('set-email-invalid'))
    await fireEvent.click(getByTestId('validate'))
    expect(getByTestId('isValid').textContent).toBe('false')
  })
})

describe('useForm - initial field values', () => {
  const initialCases = [
    { name: 'Alice', email: 'alice@ex.com', message: 'hi', age: 25, agree: true },
    { name: 'Bob', email: 'bob@ex.com', message: 'hello', age: 30, agree: false },
    { name: '', email: '', message: '', age: 0, agree: false },
    { name: 'Charlie', email: 'charlie@test.com', message: '', age: 40, agree: true },
    { name: 'Diana', email: 'diana@test.com', message: 'test', age: 0, agree: false },
  ]
  for (const init of initialCases) {
    it(`initializes name="${init.name}" email="${init.email}"`, async () => {
      const { getByTestId } = await render(<FormHarness initialValues={init} />)
      expect(getByTestId('name').textContent).toBe(init.name)
      expect(getByTestId('email').textContent).toBe(init.email)
    })
  }
})
