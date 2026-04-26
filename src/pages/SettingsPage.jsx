import { useState, useEffect } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { projects } = useProjects()
  const [selectedProject, setSelectedProject] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) setSelectedProject(projects[0].id)
  }, [projects])

  useEffect(() => {
    if (selectedProject) fetchMembers()
  }, [selectedProject])

  async function fetchMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('*, profile:profiles(full_name, email, avatar_url)')
      .eq('project_id', selectedProject)
    setMembers(data ?? [])
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim() || !selectedProject) return
    setLoading(true)
    setMsg('')
    // Find user by email
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', inviteEmail.trim())
      .single()

    if (!targetProfile) {
      setMsg('Aucun compte trouvé pour cet email.')
      setLoading(false)
      return
    }

    // Check not already member
    const existing = members.find(m => m.user_id === targetProfile.id)
    if (existing) {
      setMsg('Cet utilisateur est déjà membre du projet.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('project_members').insert({
      project_id: selectedProject,
      user_id: targetProfile.id,
      role: 'member',
    })

    if (error) {
      setMsg('Erreur lors de l\'invitation.')
    } else {
      // Send notification
      await supabase.from('notifications').insert({
        user_id: targetProfile.id,
        message: `Vous avez été ajouté au projet "${projects.find(p => p.id === selectedProject)?.name}".`,
      })
      setMsg(`${targetProfile.full_name} ajouté avec succès !`)
      setInviteEmail('')
      fetchMembers()
    }
    setLoading(false)
  }

  async function removeMember(memberId, userId) {
    if (userId === user.id) return
    if (!confirm('Retirer ce membre ?')) return
    await supabase.from('project_members').delete().eq('id', memberId)
    fetchMembers()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Équipe & Paramètres</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 max-w-2xl space-y-6">
        {/* Profile */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Mon profil</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center text-sm font-medium text-accent">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
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

        {/* Team */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Gestion de l'équipe</h2>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Projet</label>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input max-w-xs">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Members list */}
          {members.length > 0 && (
            <div className="mb-4 space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                    {m.profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800">{m.profile?.full_name}</p>
                    <p className="text-[10px] text-gray-400">{m.profile?.email}</p>
                  </div>
                  <span className={`tag text-[10px] ${m.role === 'owner' ? 'bg-accent-light text-accent' : 'bg-gray-100 text-gray-500'}`}>{m.role}</span>
                  {m.user_id !== user.id && (
                    <button onClick={() => removeMember(m.id, m.user_id)}
                      className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Retirer</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Invite form */}
          <form onSubmit={handleInvite} className="flex gap-2">
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              type="email" placeholder="email@exemple.com"
              className="input flex-1 text-xs" required />
            <button type="submit" disabled={loading || !selectedProject} className="btn btn-primary text-xs whitespace-nowrap disabled:opacity-50">
              {loading ? '...' : 'Inviter'}
            </button>
          </form>
          {msg && (
            <p className={`text-xs mt-2 ${msg.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
          )}
        </div>
      </div>
    </div>
  )
}
