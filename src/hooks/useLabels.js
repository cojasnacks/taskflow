import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useLabels() {
  const { user } = useAuth()
  const [labels, setLabels] = useState([])

  useEffect(() => {
    if (!user) return
    fetchLabels()
  }, [user])

  async function fetchLabels() {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .order('created_at', { ascending: true })
    setLabels(data ?? [])
  }

  async function createLabel(name, color) {
    const { error } = await supabase
      .from('labels')
      .insert({ name, color, owner_id: user.id })
    if (!error) fetchLabels()
    return { error }
  }

  async function renameLabel(id, name, color) {
    const { error } = await supabase
      .from('labels')
      .update({ name, color })
      .eq('id', id)
      .eq('owner_id', user.id)
    if (!error) fetchLabels()
    return { error }
  }

  async function deleteLabel(id) {
    await supabase.from('labels').delete().eq('id', id).eq('owner_id', user.id)
    fetchLabels()
  }

  return { labels, createLabel, renameLabel, deleteLabel, refetch: fetchLabels }
}