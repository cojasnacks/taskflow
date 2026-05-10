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
    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, name, color),
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, email),
        task_labels(label:labels(id, name, color))
      `)
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

    // Insert labels
    if (label_ids.length > 0) {
      await supabase.from('task_labels').insert(label_ids.map(lid => ({ task_id: data.id, label_id: lid })))
    }

    await fetchTasks()
    return { data, error }
  }

  async function updateTask(id, updates) {
    const { label_ids, ...taskUpdates } = updates

    const { error } = await supabase.from('tasks').update(taskUpdates).eq('id', id)

    // Update labels if provided
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
