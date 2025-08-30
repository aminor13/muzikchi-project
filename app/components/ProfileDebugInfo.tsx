'use client'

import { useEffect } from 'react'

interface ProfileDebugInfoProps {
  profile: any
  bandMembers: any
  bandMemberships: any
  schoolMemberships: any
  schoolTeachers: any
  pendingBandInvites: any
  pendingSchoolInvites: any
  pendingBandRequests: any
}

export default function ProfileDebugInfo({
  profile,
  bandMembers,
  bandMemberships,
  schoolMemberships,
  schoolTeachers,
  pendingBandInvites,
  pendingSchoolInvites,
  pendingBandRequests
}: ProfileDebugInfoProps) {
  
  useEffect(() => {
    // Log all the data to browser console for debugging
    console.log('=== PROFILE DEBUG INFO ===')
    console.log('Profile:', profile)
    console.log('Profile Category:', profile?.category)
    console.log('Profile Roles:', profile?.roles)
    console.log('Profile ID:', profile?.id)
    console.log('Profile Display Name:', profile?.display_name)
    
    console.log('=== BAND MEMBERS ===')
    console.log('Band Members:', bandMembers)
    console.log('Band Members Length:', bandMembers?.length || 0)
    
    console.log('=== BAND MEMBERSHIPS ===')
    console.log('Band Memberships:', bandMemberships)
    console.log('Band Memberships Length:', bandMemberships?.length || 0)
    
    console.log('=== SCHOOL MEMBERSHIPS ===')
    console.log('School Memberships:', schoolMemberships)
    console.log('School Memberships Length:', schoolMemberships?.length || 0)
    
    console.log('=== SCHOOL TEACHERS ===')
    console.log('School Teachers:', schoolTeachers)
    console.log('School Teachers Length:', schoolTeachers?.length || 0)
    
    console.log('=== PENDING INVITES ===')
    console.log('Pending Band Invites:', pendingBandInvites)
    console.log('Pending School Invites:', pendingSchoolInvites)
    console.log('Pending Band Requests:', pendingBandRequests)
    
    console.log('=== END DEBUG INFO ===')
  }, [profile, bandMembers, bandMemberships, schoolMemberships, schoolTeachers, pendingBandInvites, pendingSchoolInvites, pendingBandRequests])

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6 border-l-4 border-yellow-500">
      <h2 className="text-lg font-bold mb-4 text-yellow-500">🔍 Debug Info (Browser Console)</h2>
      <div className="space-y-2 text-sm text-gray-300">
        <div><span className="font-bold">Profile Category:</span> {profile?.category || 'null'}</div>
        <div><span className="font-bold">Profile Roles:</span> {profile?.roles?.join(', ') || 'None'}</div>
        <div><span className="font-bold">Profile ID:</span> {profile?.id || 'null'}</div>
        <div><span className="font-bold">Display Name:</span> {profile?.display_name || 'null'}</div>
        
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div><span className="font-bold">Band Members:</span> {bandMembers ? `${bandMembers.length} members` : 'null'}</div>
          <div><span className="font-bold">Band Memberships:</span> {bandMemberships ? `${bandMemberships.length} memberships` : 'null'}</div>
          <div><span className="font-bold">School Memberships:</span> {schoolMemberships ? `${schoolMemberships.length} memberships` : 'null'}</div>
          <div><span className="font-bold">School Teachers:</span> {schoolTeachers ? `${schoolTeachers.length} teachers` : 'null'}</div>
        </div>
        
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div><span className="font-bold">Pending Band Invites:</span> {pendingBandInvites ? `${pendingBandInvites.length} invites` : 'null'}</div>
          <div><span className="font-bold">Pending School Invites:</span> {pendingSchoolInvites ? `${pendingSchoolInvites.length} invites` : 'null'}</div>
          <div><span className="font-bold">Pending Band Requests:</span> {pendingBandRequests ? `${pendingBandRequests.length} requests` : 'null'}</div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-900/20 rounded border border-yellow-600">
          <p className="text-yellow-300 text-xs">
            💡 Check browser console (F12 → Console) to see detailed debug information
          </p>
        </div>
      </div>
    </div>
  )
}