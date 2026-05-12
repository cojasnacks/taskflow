import { useState, useEffect } from 'react'
import { useLabels } from '../../hooks/useLabels'
import { supabase } from '../../lib/supabase'

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
const LABEL_COLORS = ['#5344B7','#1D9E75','#BA7517','#D85A30','#D4537E','#378ADD','#888780']

export default function TaskModal({ projects, task = null, defaultStatus = 'todo', defaultProjectId = null, onSave, onClose, onDelete }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project_id: task?.project_id || defaultProjectId || projects[0]?.id || '',
    status: task?.status || defaultStatus,
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
    assignee_id: task?.assignee_id || '',
    label_ids: task?.task_labels?.map(tl => tl.label?.id).filter(Boolean) || [],
  })
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const { labels, createLabel } = useLabels()
  const [newLabel, setNewLabel] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#5344B7')
  const [showLabelForm, setShowLabelForm] = useState(false)

  useEffect(() => {
    if (form.project_id) fetchMembers(form.project_id)
  }, [form.project_id])

  async function fetchMembers(projectId) {
    const { data } = await supabase
      .from('project_members')
      .select('*, profile:profiles(id, full_name, email)')
      .eq('project_id', projectId)
      .eq('status', 'active')
    setMembers(data ?? [])
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function toggleLabel(id) {
    setForm(f => ({
      ...f,
      label_ids: f.label_ids.includes(id)
        ? f.label_ids.filter(l => l !== id)
        : [...f.label_ids, id],
    }))
  }

  async function handleAddLabel(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    await createLabel(newLabel.trim(), newLabelColor)
    setNewLabel('')
    setShowLabelForm(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    await onSave({ ...form, title: form.title.trim(), assignee_id: form.assignee_id || null })
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
    <div className="fixed inset-0 bg-black/30 flex sm:items-center items-end justify-center z-50"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white sm:rounded-2xl rounded-t-2xl shadow-xl p-5 sm:w-[440px] w-full border border-gray-100 max-h-[90vh] overflow-y-auto">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Titre</label>
            <input autoFocus name="title" value={form.title} onChange={handleChange} className="input" placeholder="Nom de la tâche..." required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input resize-none h-16 text-xs" placeholder="Détails optionnels..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Projet</label>
              <select name="project_id" value={form.project_id} onChange={handleChange} className="input">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Assigné à</label>
              <select name="assignee_id" value={form.assignee_id} onChange={handleChange} className="input">
                <option value="">— Non assigné</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || m.profile?.email}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Statut</label>
              <select name="status" value={form.status} onChange={handleChange} className="input">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priorité</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input">
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Échéance</label>
            <input name="due_date" type="date" value={form.due_date} onChange={handleChange} className="input" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-gray-500">Catégories</label>
              <button type="button" onClick={() => setShowLabelForm(v => !v)} className="text-xs text-accent hover:underline">+ Nouvelle</button>
            </div>
            {showLabelForm && (
              <div className="flex gap-2 mb-2 items-center">
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  className="input flex-1 text-xs" placeholder="Nom..." />
                <div className="flex gap-1">
                  {LABEL_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewLabelColor(c)}
                      className="w-4 h-4 rounded-full transition-transform hover:scale-110 shrink-0"
                      style={{ background: c, outline: newLabelColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
                <button type="button" onClick={handleAddLabel} className="btn btn-primary text-xs px-2">OK</button>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {labels.map(l => (
                <button key={l.id} type="button" onClick={() => toggleLabel(l.id)}
                  className="px-2 py-0.5 rounded text-xs font-medium border transition-all"
                  style={{
                    background: form.label_ids.includes(l.id) ? l.color : 'transparent',
                    color: form.label_ids.includes(l.id) ? 'white' : l.color,
                    borderColor: l.color,
                  }}>
                  {l.name}
                </button>
              ))}
              {labels.length === 0 && <p className="text-xs text-gray-400">Aucune catégorie</p>}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {task && onDelete && (
                <button type="button" onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700 transition-colors">Supprimer</button>
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