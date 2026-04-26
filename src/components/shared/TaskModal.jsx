import { useState } from 'react'

const STATUSES = [
  { value: 'todo', label: 'À faire' },
  { value: 'progress', label: 'En cours' },
  { value: 'review', label: 'En révision' },
  { value: 'done', label: 'Terminé' },
]
const PRIORITIES = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
]

export default function TaskModal({ projects, task = null, defaultStatus = 'todo', defaultProjectId = null, onSave, onClose, onDelete }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    project_id: task?.project_id || defaultProjectId || projects[0]?.id || '',
    status: task?.status || defaultStatus,
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    await onSave({ ...form, title: form.title.trim() })
    setLoading(false)
    onClose()
  }

  async function handleDelete() {
    if (!onDelete || !task) return
    if (!confirm('Supprimer cette tâche ?')) return
    await onDelete(task.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-96 border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Titre</label>
            <input autoFocus name="title" value={form.title} onChange={handleChange}
              className="input" placeholder="Nom de la tâche..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Projet</label>
              <select name="project_id" value={form.project_id} onChange={handleChange} className="input">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Statut</label>
              <select name="status" value={form.status} onChange={handleChange} className="input">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priorité</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input">
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Échéance</label>
              <input name="due_date" type="date" value={form.due_date} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {task && onDelete && (
                <button type="button" onClick={handleDelete}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors">
                  Supprimer
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn text-xs">Annuler</button>
              <button type="submit" disabled={!form.title.trim() || loading || !form.project_id}
                className="btn btn-primary text-xs disabled:opacity-50">
                {loading ? '...' : task ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
