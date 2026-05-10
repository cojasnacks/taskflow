import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useLabels(projectId) {
  const [labels, setLabels] = useState([])

  useEffect(() => {
    if (!projectId) return
    fetchLabels()
  }, [projectId])

  async function fetchLabels() {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setLabels(data ?? [])
  }

  async function createLabel(name, color) {
    const { error } = await supabase.from('labels').insert({ project_id: projectId, name, color })
    if (!error) fetchLabels()
    return { error }
  }

  async function deleteLabel(id) {
    await supabase.from('labels').delete().eq('id', id)
    fetchLabels()
  }

  return { labels, createLabel, deleteLabel, refetch: fetchLabels }
}
