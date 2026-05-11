import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function InvitePage() {
  const { token } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [status, setStatus] = useState('loading')
  const [authMode, setAuthMode] = useState('signup')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [authError, setAuthError] = useState('')

  useEffect(() => { fetchInvitation() }, [token])

  useEffect(() => {
    if (!authLoading && user && invitation) handleAccept()
  }, [user, authLoading, invitation])

  async function fetchInvitation() {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, project:projects(id, name, color)')
      .eq('token', token)
      .eq('status', 'pending')
      .single()
    if (error || !data) { setStatus('error'); return }
    setInvitation(data)
    setForm(f => ({ ...f, email: data.email }))
    setStatus('ready')
  }

  async function handleAccept() {
    if (!invitation) return
    // Récupérer tous les project_ids depuis meta ou project_id principal
    const projectIds = invitation.meta?.project_ids || [invitation.project_id]

    for (const projectId of projectIds) {
      const { data: existing } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (!existing) {
        await supabase.from('project_members').insert({
          project_id: projectId,
          user_id: user.id,
          role: 'member',
          status: 'active',
        })
      }
    }

    await supabase.from('invitations').update({ status: 'accepted' }).eq('token', token)
    setStatus('accepted')
    setTimeout(() => navigate('/'), 2000)
  }

  async function handleAuth(e) {
    e.preventDefault()
    setAuthError('')
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (error) setAuthError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })
      if (error) setAuthError(error.message)
      else setAuthMode('login')
    }
  }

  const projectNames = invitation?.meta?.project_ids
    ? invitation.meta.project_ids.length + ' projet(s)'
    : invitation?.project?.name

  if (status === 'loading') return <PageShell>Chargement...</PageShell>

  if (status === 'error') return (
    <PageShell>
      <div className="text-center">
        <p className="text-red-500 text-sm mb-2">Invitation invalide ou expirée.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary text-xs">Retour à l'app</button>
      </div>
    </PageShell>
  )

  if (status === 'accepted') return (
    <PageShell>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4 4 8-8" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">Bienvenue sur TaskFlow !</p>
        <p className="text-xs text-gray-400">Redirection en cours...</p>
      </div>
    </PageShell>
  )

  return (
    <PageShell>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">Tu as été invité à rejoindre</p>
          <p className="text-base font-semibold text-gray-900 mt-1">{projectNames}</p>
        </div>

        <div className="card p-6 shadow-sm">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1 mb-4">
            {[{ id: 'signup', label: 'Créer un compte' }, { id: 'login', label: 'Se connecter' }].map(m => (
              <button key={m.id} onClick={() => setAuthMode(m.id)}
                className={`flex-1 py-1 rounded-md text-xs transition-colors ${authMode === m.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}>
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth} className="space-y-3">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom complet</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="input" placeholder="Ton nom" required />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mot de passe</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input" placeholder="••••••••" required minLength={6} />
            </div>
            {authError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{authError}</p>}
            <button type="submit" className="w-full btn btn-primary justify-center py-2 text-sm">
              {authMode === 'signup' ? 'Créer mon compte & rejoindre' : 'Se connecter & rejoindre'}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="5" height="12" rx="1.5" fill="white"/>
            <rect x="9" y="4" width="5" height="8" rx="1.5" fill="white" fillOpacity="0.7"/>
            <rect x="14" y="7" width="4" height="9" rx="1.5" fill="white" fillOpacity="0.4"/>
          </svg>
        </div>
        <span className="font-semibold text-gray-900">TaskFlow</span>
      </div>
      {children}
    </div>
  )
}