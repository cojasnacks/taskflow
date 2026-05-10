import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useTasks(projectId = null) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTasks()

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, projectId])

  async function fetchTasks() {
    setLoading(true)

    // Récupérer uniquement les projets accessibles par l'user
    const { data: memberData } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const accessibleProjectIds = memberData?.map(m => m.project_id) ?? []

    if (accessibleProjectIds.length === 0) {
      setTasks([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, name, color),
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, email),
        task_labels(label:labels(id, name, color))
      `)
      .in('project_id', accessibleProjectIds)
      .order('created_at', { ascending: false })

    if (projectId) query = query.eq('project_id', projectId)

    const { data } = await query
    setTasks(data ?? [])
    setLoading(false)
  }

  async function createTask({ title, description, project_id, status = 'todo', priority = 'medium', due_date = null, assignee_id = null, label_ids = [] }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title, description, project_id, status, priority, due_date, assignee_id, created_by: user.id })
      .select()
      .single()

    if (error) return { data, error }

    if (label_ids.length > 0) {
      await supabase.from('task_labels').insert(label_ids.map(lid => ({ task_id: data.id, label_id: lid })))
    }

    await fetchTasks()
    return { data, error }
  }

  async function updateTask(id, updates) {
    const { label_ids, ...taskUpdates } = updates
    const { error } = await supabase.from('tasks').update(taskUpdates).eq('id', id)

    if (label_ids !== undefined) {
      await supabase.from('task_labels').delete().eq('task_id', id)
      if (label_ids.length > 0) {
        await supabase.from('task_labels').insert(label_ids.map(lid => ({ task_id: id, label_id: lid })))
      }
    }

    if (!error) await fetchTasks()
    return { error }
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    await fetchTasks()
  }

  async function moveTask(id, newStatus) {
    await updateTask(id, { status: newStatus })
  }

  return { tasks, loading, createTask, updateTask, deleteTask, moveTask, refetch: fetchTasks }
}
