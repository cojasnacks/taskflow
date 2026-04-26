import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useNotifications } from '../hooks/useNotifications'
import NewProjectModal from './shared/NewProjectModal'
import NotificationsPanel from './shared/NotificationsPanel'

const PROJECT_COLORS = ['#5344B7','#1D9E75','#BA7517','#D85A30','#D4537E','#378ADD']

export default function Layout() {
  const { profile, signOut } = useAuth()
  const { projects, createProject } = useProjects()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="5" height="12" rx="1.5" fill="white"/>
                <rect x="9" y="4" width="5" height="8" rx="1.5" fill="white" fillOpacity="0.7"/>
                <rect x="14" y="7" width="4" height="9" rx="1.5" fill="white" fillOpacity="0.4"/>
              </svg>
            </div>
            <span className="font-semibold text-sm text-gray-900">TaskFlow</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-0.5 mb-4">
            <NavLink to="/" end className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-accent-light text-accent font-medium' : 'text-gray-600 hover:bg-gray-50'}`
            }>
              <IconStats /> Tableau de bord
            </NavLink>
            <NavLink to="/kanban" className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-accent-light text-accent font-medium' : 'text-gray-600 hover:bg-gray-50'}`
            }>
              <IconKanban /> Kanban
            </NavLink>
            <NavLink to="/list" className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-accent-light text-accent font-medium' : 'text-gray-600 hover:bg-gray-50'}`
            }>
              <IconList /> Liste
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-accent-light text-accent font-medium' : 'text-gray-600 hover:bg-gray-50'}`
            }>
              <IconSettings /> Équipe & Paramètres
            </NavLink>
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between px-2.5 mb-1">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Projets</span>
              <button onClick={() => setShowNewProject(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm leading-none">+</button>
            </div>
            {projects.map(p => (
              <NavLink key={p.id} to={`/kanban?project=${p.id}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="truncate">{p.name}</span>
              </NavLink>
            ))}
            {projects.length === 0 && (
              <p className="px-2.5 text-xs text-gray-400 py-1">Aucun projet</p>
            )}
          </div>
        </nav>

        {/* User */}
        <div className="p-2 border-t border-gray-100">
          <button onClick={() => setShowNotifs(v => !v)}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 relative mb-0.5">
            <IconBell />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto bg-accent text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <div className="w-6 h-6 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
              {initials}
            </div>
            <span className="text-xs text-gray-600 truncate flex-1">{profile?.full_name || profile?.email}</span>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-gray-600 transition-colors" title="Déconnexion">
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>

      {/* Modals */}
      {showNewProject && (
        <NewProjectModal
          onCreate={createProject}
          onClose={() => setShowNewProject(false)}
          colors={PROJECT_COLORS}
        />
      )}
      {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
    </div>
  )
}

function IconStats() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="9" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="6" y="5" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="11" y="2" width="3" height="13" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
}
function IconKanban() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="6" y="3" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="11" y="3" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
}
function IconList() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><line x1="5" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="2.5" cy="4" r="1" fill="currentColor"/><circle cx="2.5" cy="8" r="1" fill="currentColor"/><circle cx="2.5" cy="12" r="1" fill="currentColor"/></svg>
}
function IconSettings() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
}
function IconBell() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A4.5 4.5 0 003.5 6v3l-1.5 2h12l-1.5-2V6A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2"/></svg>
}
function IconLogout() {
  return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
