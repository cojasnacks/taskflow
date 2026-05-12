import { useState, useEffect } from 'react'
import { useLabels } from '../../hooks/useLabels'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

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

function FileIcon({ type }) {
  if (type?.includes('image')) return <span>🖼️</span>
  if (type?.includes('pdf')) return <span>📄</span>
  if (type?.includes('word') || type?.includes('document')) return <span>📝</span>
  if (type?.includes('sheet') || type?.includes('excel')) return <span>📊</span>
  return <span>📎</span>
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function TaskModal({ projects, task = null, defaultStatus = 'todo', defaultProjectId = null, onSave, onClose, onDelete }) {
  const { user } = useAuth()
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

  // Files
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [showDriveInput, setShowDriveInput] = useState(false)

  useEffect(() => {
    if (form.project_id) fetchMembers(form.project_id)
    if (task?.id) fetchFiles(task.id)
  }, [form.project_id])

  async function fetchMembers(projectId) {
    const { data } = await supabase
      .from('project_members')
      .select('*, profile:profiles(id, full_name, email)')
      .eq('project_id', projectId)
      .eq('status', 'active')
    setMembers(data ?? [])
  }

  async function fetchFiles(taskId) {
    const { data } = await supabase
      .from('task_files')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
    setFiles(data ?? [])
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file || !task?.id) return
    if (file.size > 50 * 1024 * 1024) { alert('Fichier trop lourd (max 50MB)'); return }

    setUploading(true)
    const path = `${user.id}/${task.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('task-files').upload(path, file)

    if (!uploadError) {
      await supabase.from('task_files').insert({
        task_id: task.id,
        name: file.name,
        size: file.size,
        type: file.type,
        storage_path: path,
        uploaded_by: user.id,
      })
      await fetchFiles(task.id)
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleAddDriveLink(e) {
    e.preventDefault()
    if (!driveUrl.trim() || !task?.id) return
    const name = driveUrl.includes('drive.google.com') ? 'Google Drive — ' + driveUrl.split('/').slice(-2, -1)[0] : driveUrl
    await supabase.from('task_files').insert({
      task_id: task.id,
      name: 'Lien Google Drive',
      drive_url: driveUrl.trim(),
      uploaded_by: user.id,
    })
    await fetchFiles(task.id)
    setDriveUrl('')
    setShowDriveInput(false)
  }

  async function handleDeleteFile(file) {
    if (!confirm(`Supprimer "${file.name}" ?`)) return
    if (file.storage_path) {
      await supabase.storage.from('task-files').remove([file.storage_path])
    }
    await supabase.from('task_files').delete().eq('id', file.id)
    await fetchFiles(task.id)
  }

  async function getFileUrl(file) {
    if (file.drive_url) { window.open(file.drive_url, '_blank'); return }
    const { data } = await supabase.storage.from('task-files').createSignedUrl(file.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function toggleLabel(id) {
    setForm(f => ({
      ...f,
      label_ids: f.label_ids.includes(id) ? f.label_ids.filter(l => l !== id) : [...f.label_ids, id],
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
      <div className="bg-white sm:rounded-2xl rounded-t-2xl shadow-xl p-5 sm:w-[440px] w-full border border-gray-100 max-h-[92vh] overflow-y-auto">
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

          {/* Catégories */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-gray-500">Catégories</label>
              <button type="button" onClick={() => setShowLabelForm(v => !v)} className="text-xs text-accent hover:underline">+ Nouvelle</button>
            </div>
            {showLabelForm && (
              <div className="flex gap-2 mb-2 items-center">
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} className="input flex-1 text-xs" placeholder="Nom..." />
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

          {/* Fichiers — uniquement si tâche existante */}
          {task?.id && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs text-gray-500">Fichiers ({files.length})</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowDriveInput(v => !v)}
                    className="text-xs text-accent hover:underline">+ Drive</button>
                  <label className="text-xs text-accent hover:underline cursor-pointer">
                    {uploading ? 'Upload...' : '+ Fichier'}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {showDriveInput && (
                <div className="flex gap-2 mb-2">
                  <input value={driveUrl} onChange={e => setDriveUrl(e.target.value)}
                    className="input flex-1 text-xs" placeholder="Lien Google Drive..." />
                  <button type="button" onClick={handleAddDriveLink} className="btn btn-primary text-xs px-2">OK</button>
                </div>
              )}

              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <FileIcon type={f.type} />
                      <button type="button" onClick={() => getFileUrl(f)}
                        className="flex-1 text-xs text-gray-700 hover:text-accent text-left truncate">
                        {f.name}
                      </button>
                      {f.size && <span className="text-[10px] text-gray-400 shrink-0">{formatSize(f.size)}</span>}
                      <button type="button" onClick={() => handleDeleteFile(f)}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {files.length === 0 && (
                <p className="text-xs text-gray-400">Aucun fichier — ajoute un fichier ou un lien Drive</p>
              )}
            </div>
          )}

          {!task?.id && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">💡 Crée la tâche d'abord, puis ajoute des fichiers en la modifiant.</p>
          )}

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