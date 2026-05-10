import { useState, useEffect } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { useMembers, usePendingInvitations } from '../hooks/useMembers'

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { projects } = useProjects()
  const [selectedProject, setSelectedProject] = useState('')
  const { members, pending, inviteMember, removeMember } = useMembers(selectedProject)
  const { invitations, accept, decline } = usePendingInvitations()
  const [inviteEmail, setInviteEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) setSelectedProject(projects[0].id)
  }, [projects])

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim() || !selectedProject) return
    setLoading(true)
    setMsg('')
    const { error } = await inviteMember(inviteEmail.trim())
    setMsg(error || `Invitation envoyée !`)
    if (!error) setInviteEmail('')
    setLoading(false)
  }

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Équipe & Paramètres</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 max-w-2xl space-y-5">

        {/* Invitations en attente pour MOI */}
        {invitations.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-amber-800 mb-3">Invitations en attente</h2>
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: inv.project?.color }} />
                  <span className="text-sm text-gray-800 flex-1">{inv.project?.name}</span>
                  <button onClick={() => accept(inv.project_id)}
                    className="btn btn-primary text-xs py-1">Accepter</button>
                  <button onClick={() => decline(inv.project_id)}
                    className="btn text-xs py-1 text-red-500 border-red-200 hover:bg-red-50">Refuser</button>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <p className="text-xs text-gray-400 mb-2">Membres actifs</p>
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
                    <span className={`tag text-[10px] ${m.role === 'owner' ? 'bg-accent-light text-accent' : 'bg-gray-100 text-gray-500'}`}>{m.role}</span>
                    {m.user_id !== user.id && (
                      <button onClick={() => removeMember(m.id)}
                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Retirer</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invitations en attente (côté owner) */}
          {pending.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">En attente de réponse</p>
              <div className="space-y-2">
                {pending.map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-medium text-amber-700">
                      {initials(m.profile?.full_name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{m.profile?.full_name}</p>
                      <p className="text-[10px] text-gray-400">{m.profile?.email}</p>
                    </div>
                    <span className="tag text-[10px] bg-amber-50 text-amber-700">En attente</span>
                    <button onClick={() => removeMember(m.id)}
                      className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Annuler</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inviter */}
          <form onSubmit={handleInvite} className="flex gap-2">
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              type="email" placeholder="email@exemple.com"
              className="input flex-1 text-xs" required />
            <button type="submit" disabled={loading || !selectedProject} className="btn btn-primary text-xs whitespace-nowrap disabled:opacity-50">
              {loading ? '...' : 'Inviter'}
            </button>
          </form>
          {msg && (
            <p className={`text-xs mt-2 ${msg.includes('envoyée') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
          )}
        </div>
      </div>
    </div>
  )
}
