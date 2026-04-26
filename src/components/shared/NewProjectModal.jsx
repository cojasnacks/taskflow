import { useState } from 'react'

export default function NewProjectModal({ onCreate, onClose, colors }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(colors[0])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name.trim(), color)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80 border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Nouveau projet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom du projet</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              className="input" placeholder="ex: Lancement Q3" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Couleur</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn text-xs">Annuler</button>
            <button type="submit" disabled={!name.trim() || loading} className="btn btn-primary text-xs disabled:opacity-50">
              {loading ? '...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
