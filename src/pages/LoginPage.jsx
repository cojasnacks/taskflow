import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password)
      if (error) setError(error.message)
      else navigate('/')
    } else {
      const { error } = await signUp(form.email, form.password, form.fullName)
      if (error) setError(error.message)
      else setMode('login'), setError('Compte créé ! Connecte-toi.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="5" height="12" rx="1.5" fill="white"/>
              <rect x="9" y="4" width="5" height="8" rx="1.5" fill="white" fillOpacity="0.7"/>
              <rect x="14" y="7" width="4" height="9" rx="1.5" fill="white" fillOpacity="0.4"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">TaskFlow</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'Connecte-toi à ton espace' : 'Crée ton compte'}
          </p>
        </div>

        <div className="card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet</label>
                <input name="fullName" type="text" value={form.fullName} onChange={handleChange}
                  className="input" placeholder="Mike Coja" required />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="input" placeholder="mike@cojasnacks.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className="input" placeholder="••••••••" required minLength={6} />
            </div>

            {error && (
              <p className={`text-xs px-3 py-2 rounded-lg ${error.includes('Compte créé') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn btn-primary justify-center py-2 text-sm disabled:opacity-60">
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-accent font-medium hover:underline">
              {mode === 'login' ? 'Inscription' : 'Connexion'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
