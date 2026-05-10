import { useState, useEffect } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { projects } = useProjects()
  const [selectedProject, setSelectedProject] = useState('')
  const { members, invitations, inviteMember, removeMember, cancelInvitation } = useMembers(selectedProject)
  const [inviteEmail, setInviteEmail] = useState('')
  const [msg, setMsg] = useState({ text: '', ok: false })
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

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

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

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
                    {m.user_id !== user.id && (
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
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs text-amber-700">
                      ✉
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-700">{inv.email}</p>
                      <p className="text-[10px] text-gray-400">En attente d'acceptation</p>
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

          {/* Lien d'invitation */}
          {inviteLink && (
            <div className="mt-3 p-3 bg-accent-light rounded-lg">
              <p className="text-xs text-accent font-medium mb-1">Lien d'invitation à envoyer :</p>
              <div className="flex gap-2 items-center">
                <input readOnly value={inviteLink}
                  className="input text-xs flex-1 bg-white text-gray-600" />
                <button onClick={() => { navigator.clipboard.writeText(inviteLink); setMsg({ text: 'Lien copié !', ok: true }) }}
                  className="btn btn-primary text-xs whitespace-nowrap">
                  Copier
                </button>
              </div>
              <p className="text-[10px] text-accent/70 mt-1">Envoie ce lien à ton invité par email, WhatsApp, etc.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
