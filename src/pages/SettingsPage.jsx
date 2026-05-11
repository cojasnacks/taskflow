import { useState, useEffect } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import { supabase } from '../lib/supabase'

const PROJECT_COLORS = ['#5344B7','#1D9E75','#BA7517','#D85A30','#D4537E','#378ADD']

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { projects, createProject, deleteProject, refetch } = useProjects()
  const [selectedProject, setSelectedProject] = useState('')
  const { members, invitations, inviteMember, removeMember, cancelInvitation } = useMembers(selectedProject)
  const [inviteEmail, setInviteEmail] = useState('')
  const [msg, setMsg] = useState({ text: '', ok: false })
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  // Rename state
  const [editingProject, setEditingProject] = useState(null) // { id, name, color }
  const [renameLoading, setRenameLoading] = useState(false)

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) setSelectedProject(projects[0].id)
  }, [projects])

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim() || !selectedProject) return
    setLoading(true)
    setMsg({ text: '', ok: false })
    setInviteLink('')
    const { error, inviteLink: link } = await inviteMember(inviteEmail.trim())
    if (error) {
      setMsg({ text: error, ok: false })
    } else {
      setMsg({ text: 'Invitation créée !', ok: true })
      setInviteLink(link)
      setInviteEmail('')
    }
    setLoading(false)
  }

  async function handleRename(e) {
    e.preventDefault()
    if (!editingProject?.name.trim()) return
    setRenameLoading(true)
    await supabase.from('projects')
      .update({ name: editingProject.name, color: editingProject.color })
      .eq('id', editingProject.id)
    await refetch()
    setEditingProject(null)
    setRenameLoading(false)
  }

  async function handleDelete(project) {
    if (!confirm(`Supprimer le projet "${project.name}" ? Toutes les tâches seront supprimées.`)) return
    await deleteProject(project.id)
    if (selectedProject === project.id) setSelectedProject(projects.find(p => p.id !== project.id)?.id || '')
  }

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
  const selectedProjectData = projects.find(p => p.id === selectedProject)
  const isOwner = selectedProjectData?.owner_id === user?.id

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Équipe & Paramètres</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 max-w-2xl space-y-5">

        {/* Mon profil */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Mon profil</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center text-sm font-medium text-accent">
              {initials(profile?.full_name)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{profile?.full_name || '—'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button onClick={signOut} className="ml-auto btn text-xs text-red-500 border-red-200 hover:bg-red-50">
              Déconnexion
            </button>
          </div>
        </div>

        {/* Gestion des projets */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Mes projets</h2>

          {projects.length === 0 ? (
            <p className="text-xs text-gray-400">Aucun projet</p>
          ) : (
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 group">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-sm text-gray-800 flex-1">{p.name}</span>
                  {p.owner_id === user?.id && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingProject({ id: p.id, name: p.name, color: p.color })}
                        className="text-xs text-gray-400 hover:text-accent transition-colors">
                        Renommer
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gestion équipe */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Gestion de l'équipe</h2>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Projet</label>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input max-w-xs">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Membres actifs */}
          {members.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Membres actifs — {members.length}</p>
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                    <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-xs font-medium text-accent">
                      {initials(m.profile?.full_name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{m.profile?.full_name}</p>
                      <p className="text-[10px] text-gray-400">{m.profile?.email}</p>
                    </div>
                    <span className={`tag text-[10px] ${m.role === 'owner' ? 'bg-accent-light text-accent' : 'bg-gray-100 text-gray-500'}`}>
                      {m.role}
                    </span>
                    {m.user_id !== user.id && isOwner && (
                      <button onClick={() => removeMember(m.id)}
                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Retirer</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invitations en attente */}
          {invitations.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Invitations envoyées — {invitations.length}</p>
              <div className="space-y-2">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs text-amber-700">✉</div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-700">{inv.email}</p>
                      <p className="text-[10px] text-gray-400">En attente</p>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`); setMsg({ text: 'Lien copié !', ok: true }) }}
                      className="text-[10px] text-accent hover:underline">
                      Copier lien
                    </button>
                    <button onClick={() => cancelInvitation(inv.id)}
                      className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Annuler</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire invitation */}
          {isOwner && (
            <>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  type="email" placeholder="email@exemple.com"
                  className="input flex-1 text-xs" required />
                <button type="submit" disabled={loading || !selectedProject}
                  className="btn btn-primary text-xs whitespace-nowrap disabled:opacity-50">
                  {loading ? '...' : 'Inviter'}
                </button>
              </form>

              {msg.text && (
                <p className={`text-xs mt-2 ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>
              )}

              {inviteLink && (
                <div className="mt-3 p-3 bg-accent-light rounded-lg">
                  <p className="text-xs text-accent font-medium mb-1">Lien d'invitation :</p>
                  <div className="flex gap-2 items-center">
                    <input readOnly value={inviteLink} className="input text-xs flex-1 bg-white text-gray-600" />
                    <button onClick={() => { navigator.clipboard.writeText(inviteLink); setMsg({ text: 'Lien copié !', ok: true }) }}
                      className="btn btn-primary text-xs whitespace-nowrap">Copier</button>
                  </div>
                  <p className="text-[10px] text-accent/70 mt-1">Envoie ce lien à ton invité.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal renommer */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={e => e.target === e.currentTarget && setEditingProject(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Renommer le projet</h2>
            <form onSubmit={handleRename} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom</label>
                <input autoFocus value={editingProject.name}
                  onChange={e => setEditingProject(p => ({ ...p, name: e.target.value }))}
                  className="input" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Couleur</label>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setEditingProject(p => ({ ...p, color: c }))}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, outline: editingProject.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingProject(null)} className="btn text-xs">Annuler</button>
                <button type="submit" disabled={renameLoading} className="btn btn-primary text-xs disabled:opacity-50">
                  {renameLoading ? '...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
