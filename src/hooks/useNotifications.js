import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    fetchNotifications()

    const channel = supabase
      .channel('notifications-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
    setUnreadCount(data?.filter(n => !n.read).length ?? 0)
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    await fetchNotifications()
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    await fetchNotifications()
  }

  return { notifications, unreadCount, markAllRead, markRead }
}
