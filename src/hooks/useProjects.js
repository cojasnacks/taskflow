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
    const { data } = await supabase
      .from('project_members')
      .select('project:projects(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setProjects(data?.map(d => d.project) ?? [])
    setLoading(false)
  }

  async function createProject(name, color) {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name, color, owner_id: user.id })
      .select()
      .single()
    if (error || !project) return { error }

    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: user.id,
      role: 'owner',
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
