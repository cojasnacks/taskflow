import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { isPast, isThisWeek } from 'date-fns'

export default function StatsPage() {
  const { tasks, loading } = useTasks()
  const { projects } = useProjects()

  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'progress').length
  const late = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'done').length
  const dueThisWeek = tasks.filter(t => t.due_date && isThisWeek(new Date(t.due_date)) && t.status !== 'done').length
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  const projectStats = projects.map(p => {
    const projectTasks = tasks.filter(t => t.project_id === p.id)
    const projectDone = projectTasks.filter(t => t.status === 'done').length
    const pct = projectTasks.length > 0 ? Math.round((projectDone / projectTasks.length) * 100) : 0
    return { ...p, total: projectTasks.length, done: projectDone, pct }
  })

  const recentDone = tasks.filter(t => t.status === 'done').slice(0, 5)

  const statCards = [
    { label: 'Total tâches', value: total, sub: 'tous projets' },
    { label: 'Terminées', value: done, sub: `${completionRate}% complété`, accent: true },
    { label: 'En cours', value: inProgress, sub: 'en progression' },
    { label: 'En retard', value: late, sub: 'action requise', danger: late > 0 },
    { label: 'Cette semaine', value: dueThisWeek, sub: 'à livrer' },
  ]

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Chargement...</div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Tableau de bord</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-5 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold ${s.danger ? 'text-red-500' : s.accent ? 'text-accent' : 'text-gray-900'}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Avancement projets */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Avancement par projet</h2>
          {projectStats.length === 0 ? (
            <p className="text-xs text-gray-400">Aucun projet</p>
          ) : (
            <div className="space-y-4">
              {projectStats.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-sm text-gray-700">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{p.done}/{p.total} tâches</span>
                      <span className="font-medium text-gray-600">{p.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p.pct}%`, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statut distribution */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Par statut</h2>
            {[
              { label: 'À faire', status: 'todo', color: '#888780' },
              { label: 'En cours', status: 'progress', color: '#EF9F27' },
              { label: 'En révision', status: 'review', color: '#7F77DD' },
              { label: 'Terminé', status: 'done', color: '#1D9E75' },
            ].map(s => {
              const count = tasks.filter(t => t.status === s.status).length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={s.status} className="flex items-center gap-3 py-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-gray-600 flex-1">{s.label}</span>
                  <span className="text-xs font-medium text-gray-700">{count}</span>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Récemment terminées</h2>
            {recentDone.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune tâche terminée</p>
            ) : (
              <div className="space-y-2">
                {recentDone.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-accent bg-accent flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate line-through">{t.title}</p>
                    </div>
                    {t.project && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.project.color }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
