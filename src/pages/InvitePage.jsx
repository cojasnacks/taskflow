import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function InvitePage() {
  const { token } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | accepted | error
  const [authMode, setAuthMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    fetchInvitation()
  }, [token])

  useEffect(() => {
    if (!authLoading && user && invitation) {
      handleAccept()
    }
  }, [user, authLoading, invitation])

  async function fetchInvitation() {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, project:projects(id, name, color)')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (error || !data) {
      setStatus('error')
      return
    }
    setInvitation(data)
    setForm(f => ({ ...f, email: data.email }))
    setStatus('ready')
  }

  async function handleAccept() {
    if (!invitation) return

    // Vérifier si déjà membre
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', invitation.project_id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      await supabase.from('project_members').insert({
        project_id: invitation.project_id,
        user_id: user.id,
        role: 'member',
        status: 'active',
      })
    }

    // Marquer l'invitation comme acceptée
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
    }
  }

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
        <p className="text-sm font-medium text-gray-900 mb-1">Invitation acceptée !</p>
        <p className="text-xs text-gray-400">Redirection en cours...</p>
      </div>
    </PageShell>
  )

  return (
    <PageShell>
      <div className="w-full max-w-sm">
        {/* Projet */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-3 h-3 rounded-full" style={{ background: invitation.project?.color }} />
          <span className="text-sm font-medium text-gray-700">
            Invitation au projet <strong>{invitation.project?.name}</strong>
          </span>
        </div>

        {!user ? (
          <div className="card p-6 shadow-sm">
            <p className="text-xs text-gray-500 text-center mb-4">
              {authMode === 'login' ? 'Connecte-toi pour accepter l\'invitation' : 'Crée ton compte pour rejoindre le projet'}
            </p>
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
                {authMode === 'login' ? 'Se connecter & rejoindre' : 'Créer mon compte & rejoindre'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-3">
              {authMode === 'login' ? 'Pas de compte ? ' : 'Déjà un compte ? '}
              <button onClick={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')}
                className="text-accent hover:underline">
                {authMode === 'login' ? 'Inscription' : 'Connexion'}
              </button>
            </p>
          </div>
        ) : (
          <div className="card p-6 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-4">Accepter l'invitation au projet <strong>{invitation.project?.name}</strong> ?</p>
            <button onClick={handleAccept} className="btn btn-primary w-full justify-center">Accepter</button>
          </div>
        )}
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
