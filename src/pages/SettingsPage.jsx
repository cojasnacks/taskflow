import { useState, useEffect } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const PROJECT_COLORS = ['#5344B7','#1D9E75','#BA7517','#D85A30','#D4537E','#378ADD']

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { projects, deleteProject, refetch } = useProjects()
  const [tab, setTab] = useState('users')
  const [allMembers, setAllMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteProjects, setInviteProjects] = useState([])
  const [inviteMsg, setInviteMsg] = useState({ text: '', ok: false })
  const [inviteLinks, setInviteLinks] = useState([])
  const [inviteLoading, setInviteLoading] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [renameLoading, setRenameLoading] = useState(false)

  useEffect(() => { fetchAllMembers() }, [projects])

  async function fetchAllMembers() {
    if (projects.length === 0) { setLoadingMembers(false); return }
    setLoadingMembers(true)
    const { data } = await supabase
      .from('project_members')
      .select('id, role, status, user_id, project_id, profile:profiles(id, full_name, email), project:projects(id, name, color)')
      .in('project_id', projects.map(p => p.id))
      .eq('status', 'active')
    const byUser = {}
    for (const m of data ?? []) {
      if (!m.profile) continue
      if (!byUser[m.user_id]) byUser[m.user_id] = { profile: m.profile, memberships: [] }
      byUser[m.user_id].memberships.push({ project: m.project, role: m.role, member_id: m.id })
    }
    setAllMembers(Object.values(byUser))
    setLoadingMembers(false)
  }

  async function toggleUserProject(userId, projectId, currentlyMember, memberId) {
    if (currentlyMember) {
      await supabase.from('project_members').delete().eq('id', memberId)
    } else {
      await supabase.from('project_members').insert({ project_id: projectId, user_id: userId, role: 'member', status: 'active' })
    }
    await fetchAllMembers()
  }

  async function removeUserFromAll(userId) {
    if (!confirm('Retirer cet utilisateur de tous les projets ?')) return
    await supabase.from('project_members').delete().eq('user_id', userId).neq('role', 'owner')
    await fetchAllMembers()
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim() || inviteProjects.length === 0) return
    setInviteLoading(true)
    setInviteMsg({ text: '', ok: false })
    setInviteLinks([])
    const links = []
    for (const projectId of inviteProjects) {
      const { data: existing } = await supabase.from('invitations').select('id').eq('project_id', projectId).eq('email', inviteEmail.trim()).eq('status', 'pending').single()
      if (existing) continue
      const { data: invitation } = await supabase.from('invitations').insert({ project_id: projectId, email: inviteEmail.trim(), invited_by: user.id }).select().single()
      if (invitation) {
        const project = projects.find(p => p.id === projectId)
        links.push({ project: project?.name, link: `${window.location.origin}/invite/${invitation.token}` })
        const { data: ep } = await supabase.from('profiles').select('id').eq('email', inviteEmail.trim()).single()
        if (ep) await supabase.from('notifications').insert({ user_id: ep.id, message: `Vous avez été invité au projet "${project?.name}".` })
      }
    }
    if (links.length > 0) {
      setInviteLinks(links)
      setInviteMsg({ text: `${links.length} invitation(s) créée(s) !`, ok: true })
      setInviteEmail('')
      setInviteProjects([])
    } else {
      setInviteMsg({ text: 'Invitations déjà envoyées pour ces projets.', ok: false })
    }
    setInviteLoading(false)
  }

  async function handleRename(e) {
    e.preventDefault()
    if (!editingProject?.name.trim()) return
    setRenameLoading(true)
    await supabase.from('projects').update({ name: editingProject.name, color: editingProject.color }).eq('id', editingProject.id)
    await refetch()
    setEditingProject(null)
    setRenameLoading(false)
  }

  async function handleDelete(project) {
    if (!confirm(`Supprimer "${project.name}" ? Toutes les tâches seront supprimées.`)) return
    await deleteProject(project.id)
  }

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Équipe & Paramètres</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 ml-2">
          {[{ id: 'users', label: 'Utilisateurs' }, { id: 'projects', label: 'Projets' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-xs font-medium text-accent">{initials(profile?.full_name)}</div>
          <span className="text-xs text-gray-600">{profile?.full_name}</span>
          <button onClick={signOut} className="btn text-xs text-red-500 border-red-200 hover:bg-red-50 ml-2">Déconnexion</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'users' && (
          <div className="max-w-3xl space-y-5">
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Inviter un utilisateur</h2>
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="email@exemple.com" className="input max-w-xs" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Projets accessibles</label>
                  <div className="flex flex-wrap gap-2">
                    {projects.map(p => {
                      const selected = inviteProjects.includes(p.id)
                      return (
                        <button key={p.id} type="button"
                          onClick={() => setInviteProjects(prev => selected ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                          style={{ background: selected ? p.color : 'transparent', color: selected ? 'white' : p.color, borderColor: p.color }}>
                          {p.name}
                        </button>
                      )
                    })}
                  </div>
                  {inviteProjects.length === 0 && <p className="text-[10px] text-gray-400 mt-1">Sélectionne au moins un projet</p>}
                </div>
                <button type="submit" disabled={inviteLoading || inviteProjects.length === 0} className="btn btn-primary text-xs disabled:opacity-50">
                  {inviteLoading ? '...' : 'Envoyer les invitations'}
                </button>
              </form>
              {inviteMsg.text && <p className={`text-xs mt-3 ${inviteMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{inviteMsg.text}</p>}
              {inviteLinks.length > 0 && (
                <div className="mt-3 space-y-2">
                  {inviteLinks.map((l, i) => (
                    <div key={i} className="p-3 bg-accent-light rounded-lg">
                      <p className="text-xs text-accent font-medium mb-1">Lien — {l.project}</p>
                      <div className="flex gap-2">
                        <input readOnly value={l.link} className="input text-xs flex-1 bg-white text-gray-600" />
                        <button onClick={() => navigator.clipboard.writeText(l.link)} className="btn btn-primary text-xs whitespace-nowrap">Copier</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Utilisateurs ({allMembers.length})</h2>
              {loadingMembers ? <p className="text-xs text-gray-400">Chargement...</p> : allMembers.length === 0 ? <p className="text-xs text-gray-400">Aucun membre</p> : (
                <div className="space-y-4">
                  {allMembers.map(({ profile: p, memberships }) => {
                    const isMe = p.id === user.id
                    return (
                      <div key={p.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-sm font-medium text-accent shrink-0">{initials(p.full_name)}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{p.full_name} {isMe && <span className="text-[10px] text-gray-400">(moi)</span>}</p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </div>
                          {!isMe && (
                            <button onClick={() => removeUserFromAll(p.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Retirer tout</button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {projects.map(proj => {
                            const membership = memberships.find(m => m.project?.id === proj.id)
                            const isMember = !!membership
                            const isOwnerOfProject = membership?.role === 'owner'
                            return (
                              <button key={proj.id} type="button"
                                disabled={isOwnerOfProject || isMe}
                                onClick={() => toggleUserProject(p.id, proj.id, isMember, membership?.member_id)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all disabled:cursor-default"
                                style={{ background: isMember ? proj.color : 'transparent', color: isMember ? 'white' : '#9ca3af', borderColor: isMember ? proj.color : '#e5e7eb' }}>
                                {isMember && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                {proj.name}
                                {isOwnerOfProject && <span className="ml-0.5 opacity-70">·owner</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'projects' && (
          <div className="max-w-xl">
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Mes projets ({projects.length})</h2>
              {projects.length === 0 ? <p className="text-xs text-gray-400">Aucun projet</p> : (
                <div className="space-y-2">
                  {projects.map(p => (
                    <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 group">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                      <span className="text-sm text-gray-800 flex-1">{p.name}</span>
                      <span className="text-xs text-gray-400">{allMembers.filter(m => m.memberships.some(ms => ms.project?.id === p.id)).length} membre(s)</span>
                      {p.owner_id === user?.id && (
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingProject({ id: p.id, name: p.name, color: p.color })} className="text-xs text-gray-400 hover:text-accent transition-colors">Renommer</button>
                          <button onClick={() => handleDelete(p)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Supprimer</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editingProject && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && setEditingProject(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Renommer le projet</h2>
            <form onSubmit={handleRename} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom</label>
                <input autoFocus value={editingProject.name} onChange={e => setEditingProject(p => ({ ...p, name: e.target.value }))} className="input" required />
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
                <button type="submit" disabled={renameLoading} className="btn btn-primary text-xs disabled:opacity-50">{renameLoading ? '...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}