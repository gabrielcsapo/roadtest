import { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'

function AddTaskForm({ onAdd }: { onAdd: (title: string, description: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  function submit() {
    const t = title.trim()
    if (!t) return
    onAdd(t, description.trim())
    setTitle('')
    setDescription('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 8,
          border: '1px dashed #2a2a36', background: 'transparent',
          color: '#6b7280', fontSize: 13, cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.color = '#818cf8' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a36'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
      >
        + Add task
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: '#1a1a24', border: '1px solid #2a2a36', borderRadius: 8 }}>
      <input
        autoFocus
        placeholder="Task title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        style={inputStyle}
      />
      <input
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button label="Add" variant="primary" onClick={submit} />
        <Button label="Cancel" variant="secondary" onClick={() => setOpen(false)} />
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#0f0f13', border: '1px solid #2a2a36', borderRadius: 6,
  padding: '7px 10px', color: '#e2e2e8', fontSize: 13, outline: 'none',
  width: '100%',
}

export interface Task {
  id: string
  title: string
  description: string
  done: boolean
}

interface TaskBoardProps {
  initialTasks?: Task[]
}

export function TaskBoard({ initialTasks = [] }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  function complete(id: string) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: true } : t))
  }

  function remove(id: string) {
    setTasks(ts => ts.filter(t => t.id !== id))
  }

  function clearDone() {
    setTasks(ts => ts.filter(t => !t.done))
  }

  function addTask(title: string, description: string) {
    const id = `task-${Date.now()}`
    setTasks(ts => [...ts, { id, title, description, done: false }])
  }

  return (
    <div
      data-testid="task-board"
      style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400, padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#e2e2e8', fontWeight: 700, fontSize: 18 }}>Tasks</span>
        <span
          data-testid="pending-count"
          style={{
            background: '#6366f1', color: '#fff', borderRadius: 12,
            padding: '2px 10px', fontSize: 13, fontWeight: 700,
          }}
        >
          {pending.length}
        </span>
      </div>

      <div data-testid="pending-tasks" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pending.map(task => (
          <Card
            key={task.id}
            title={task.title}
            description={task.description}
            actionLabel="Complete"
            onAction={() => complete(task.id)}
          />
        ))}
        {pending.length === 0 && (
          <p data-testid="empty-pending" style={{ color: '#6b7280', fontSize: 13 }}>
            All caught up!
          </p>
        )}
        <AddTaskForm onAdd={addTask} />
      </div>

      {done.length > 0 && (
        <div data-testid="done-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: 13 }}>Completed ({done.length})</span>
            <Button label="Clear" variant="secondary" onClick={clearDone} />
          </div>
          {done.map(task => (
            <Card
              key={task.id}
              title={task.title}
              description={task.description}
              actionLabel="Remove"
              onAction={() => remove(task.id)}
              variant="danger"
            />
          ))}
        </div>
      )}
    </div>
  )
}
