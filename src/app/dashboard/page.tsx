import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import type { Link as LinkType } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  const serviceClient = createServiceClient()

  // Fetch profile
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch links
  const { data: links } = await serviceClient
    .from('links')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  // Count this month's links
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { count: monthCount } = await serviceClient
    .from('links')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart.toISOString())

  const plan = profile?.plan ?? 'free'
  const monthlyLimit = plan === 'pro' ? 1000 : 30

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? '' }}
      links={(links ?? []) as LinkType[]}
      plan={plan}
      monthCount={monthCount ?? 0}
      monthlyLimit={monthlyLimit}
    />
  )
}
