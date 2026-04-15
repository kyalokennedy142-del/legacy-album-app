// src/app/profile/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileContent from '@/components/profile/ProfileContent'

export const dynamic = 'force-dynamic'

 async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 neon-pink">Account Settings</h1>
        <ProfileContent user={user} />
      </div>
    </div>
  )
}
export default ProfilePage