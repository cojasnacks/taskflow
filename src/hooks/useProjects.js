import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchProjects()
  }, [user])

  async function fetchProjects() {
    setLoading(true)
    // Récupérer tous les projets où l'user est membre actif (owner OU invité accepté)
    const { data } = await supabase
      .from('project_members')
      .select('project:projects(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
    setProjects(data?.map(d => d.project).filter(Boolean) ?? [])
    setLoading(false)
  }

  async function createProject(name, color) {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name, color, owner_id: user.id })
      .select()
      .single()
    if (error) return { error }
    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
    })
    await fetchProjects()
    return { project }
  }

  async function deleteProject(id) {
    await supabase.from('projects').delete().eq('id', id)
    await fetchProjects()
  }

  return { projects, loading, createProject, deleteProject, refetch: fetchProjects }
}
