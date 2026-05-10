import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMembers(projectId) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [pending, setPending] = useState([])

  useEffect(() => {
    if (!projectId) return
    fetchMembers()
  }, [projectId])

  async function fetchMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('*, profile:profiles(id, full_name, email)')
      .eq('project_id', projectId)
    const all = data ?? []
    setMembers(all.filter(m => m.status === 'active'))
    setPending(all.filter(m => m.status === 'pending'))
  }

  async function inviteMember(email) {
    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', email)
      .single()

    if (!profile) return { error: 'Aucun compte trouvé pour cet email.' }

    const existing = [...members, ...pending].find(m => m.user_id === profile.id)
    if (existing) return { error: 'Cet utilisateur est déjà membre ou invité.' }

    const { error } = await supabase.from('project_members').insert({
      project_id: projectId,
      user_id: profile.id,
      role: 'member',
      status: 'pending',
    })

    if (!error) {
      // Notification
      const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
      await supabase.from('notifications').insert({
        user_id: profile.id,
        message: `Vous avez été invité au projet "${project?.name}". Acceptez l'invitation dans Paramètres.`,
      })
      await fetchMembers()
    }
    return { error: error?.message }
  }

  async function removeMember(memberId) {
    await supabase.from('project_members').delete().eq('id', memberId)
    await fetchMembers()
  }

  async function acceptInvitation(projectId) {
    await supabase
      .from('project_members')
      .update({ status: 'active' })
      .eq('project_id', projectId)
      .eq('user_id', user.id)
    await fetchMembers()
  }

  return { members, pending, inviteMember, removeMember, acceptInvitation, refetch: fetchMembers }
}

// Hook pour les invitations en attente de l'utilisateur connecté
export function usePendingInvitations() {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState([])

  useEffect(() => {
    if (!user) return
    fetchInvitations()
  }, [user])

  async function fetchInvitations() {
    const { data } = await supabase
      .from('project_members')
      .select('*, project:projects(id, name, color)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
    setInvitations(data ?? [])
  }

  async function accept(projectId) {
    await supabase
      .from('project_members')
      .update({ status: 'active' })
      .eq('project_id', projectId)
      .eq('user_id', user.id)
    await fetchInvitations()
  }

  async function decline(projectId) {
    await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
    await fetchInvitations()
  }

  return { invitations, accept, decline, refetch: fetchInvitations }
}
