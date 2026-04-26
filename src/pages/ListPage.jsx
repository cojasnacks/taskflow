import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import TaskModal from "../components/shared/TaskModal";
import { format, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_LABELS = { todo: 'À faire', progress: 'En cours', review: 'En révision', done: 'Terminé' }
const STATUS_COLORS = { todo: 'bg-gray-100 text-gray-500', progress: 'bg-amber-50 text-amber-700', review: 'bg-accent-light text-accent', done: 'bg-green-50 text-green-700' }
const PRIORITY_DOT = { high: '#E24B4A', medium: '#EF9F27', low: '#1D9E75' }

export default function ListPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks()
  const { projects } = useProjects()
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = tasks.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  function openEdit(task) {
    setEditTask(task)
    setShowModal(true)
  }

  async function handleSave(data) {
    if (editTask) await updateTask(editTask.id, data)
    else await createTask(data)
  }

  async function toggleDone(task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await updateTask(task.id, { status: newStatus })
  }

  const FILTERS = [
    { id: 'all', label: 'Toutes' },
    { id: 'todo', label: 'À faire' },
    { id: 'progress', label: 'En cours' },
    { id: 'review', label: 'En révision' },
    { id: 'done', label: 'Terminées' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Liste</h1>
        <div className="relative flex-1 max-w-xs">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-accent-mid focus:ring-1 focus:ring-accent-mid outline-none transition-colors" />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filter === f.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditTask(null); setShowModal(true) }} className="btn btn-primary text-xs ml-auto">+ Tâche</button>
      </header>

      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-sm text-gray-400">Aucune tâche</p>
            <button onClick={() => setShowModal(true)} className="text-xs text-accent hover:underline">+ Créer une tâche</button>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-8 py-2 px-4" />
                <th className="text-left py-2 px-2 font-medium text-gray-500">Titre</th>
                <th className="text-left py-2 px-2 font-medium text-gray-500 w-28">Projet</th>
                <th className="text-left py-2 px-2 font-medium text-gray-500 w-28">Statut</th>
                <th className="text-left py-2 px-2 font-medium text-gray-500 w-20">Priorité</th>
                <th className="text-left py-2 px-2 font-medium text-gray-500 w-24">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const isLate = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done'
                const isDone = task.status === 'done'
                return (
                  <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openEdit(task)}>
                    <td className="py-2.5 px-4" onClick={e => { e.stopPropagation(); toggleDone(task) }}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${isDone ? 'bg-accent border-accent' : 'border-gray-300 hover:border-accent'}`}>
                        {isDone && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </td>
                    <td className={`py-2.5 px-2 text-gray-800 ${isDone ? 'line-through text-gray-400' : ''}`}>{task.title}</td>
                    <td className="py-2.5 px-2">
                      {task.project && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: task.project.color }} />
                          <span className="text-gray-500 truncate">{task.project.name}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`tag ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} />
                        <span className="text-gray-500 capitalize">{task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moy.' : 'Basse'}</span>
                      </span>
                    </td>
                    <td className={`py-2.5 px-2 ${isLate ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {task.due_date ? format(new Date(task.due_date), 'd MMM', { locale: fr }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <TaskModal
          projects={projects}
          task={editTask}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onDelete={editTask ? deleteTask : null}
        />
      )}
    </div>
  )
}
