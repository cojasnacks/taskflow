import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMembers(projectId) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])

  useEffect(() => {
    if (!projectId) return
    fetchMembers()
    fetchInvitations()
  }, [projectId])

  async function fetchMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('*, profile:profiles(id, full_name, email)')
      .eq('project_id', projectId)
      .eq('status', 'active')
    setMembers(data ?? [])
  }

  async function fetchInvitations() {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending')
    setInvitations(data ?? [])
  }

  async function inviteMember(email) {
    // Vérifier si déjà invité
    const already = invitations.find(i => i.email.toLowerCase() === email.toLowerCase())
    if (already) return { error: 'Une invitation est déjà en attente pour cet email.' }

    // Vérifier si déjà membre
    const alreadyMember = members.find(m => m.profile?.email?.toLowerCase() === email.toLowerCase())
    if (alreadyMember) return { error: 'Cet utilisateur est déjà membre du projet.' }

    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    // Créer l'invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({ project_id: projectId, email, invited_by: user.id })
      .select()
      .single()

    if (error) return { error: error.message }

    // Construire le lien d'invitation
    const inviteLink = `${window.location.origin}/invite/${invitation.token}`

    // Si l'utilisateur existe déjà → notification
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      await supabase.from('notifications').insert({
        user_id: existingProfile.id,
        message: `Vous avez été invité au projet "${project?.name}". Cliquez ici pour accepter : ${inviteLink}`,
      })
    }

    await fetchInvitations()
    return { error: null, inviteLink }
  }

  async function removeMember(memberId) {
    await supabase.from('project_members').delete().eq('id', memberId)
    await fetchMembers()
  }

  async function cancelInvitation(invitationId) {
    await supabase.from('invitations').delete().eq('id', invitationId)
    await fetchInvitations()
  }

  return { members, invitations, inviteMember, removeMember, cancelInvitation, refetch: fetchMembers }
}

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

  return { invitations, accept, decline }
}
