import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/server'
import AdminDashboardClient from './AdminDashboardClient'

export const dynamic = 'force-dynamic'

async function fetchStats() {
  const db = createServiceClient()
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
  const today = now.toISOString().slice(0, 10)

  const [
    // Users
    { count: totalUsers },
    { count: newUsersToday },
    { count: newUsersWeek },
    { count: newUsersMonth },
    { data: planBreakdown },

    // Links
    { count: totalLinks },
    { count: linksToday },
    { count: linksWeek },
    { count: linksMonth },
    { count: anonLinks },
    { data: modeBreakdown },
    { data: topLinks },

    // Anon usage
    { data: anonToday },

    // Audit
    { count: blockedToday },
    { count: rateLimitedToday },
    { data: recentAudit },
  ] = await Promise.all([
    // Users
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
    db.from('profiles').select('plan'),

    // Links
    db.from('links').select('*', { count: 'exact', head: true }),
    db.from('links').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    db.from('links').select('*', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
    db.from('links').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
    db.from('links').select('*', { count: 'exact', head: true }).eq('created_by_type', 'anonymous'),
    db.from('links').select('mode'),
    db.from('links').select('slug, original_url, click_count, created_at, created_by_type').order('click_count', { ascending: false }).limit(10),

    // Anon usage today
    db.from('anon_usage').select('create_count').eq('day_bucket', today),

    // Audit
    db.from('audit_events').select('*', { count: 'exact', head: true }).eq('status', 'blocked').gte('created_at', todayStart.toISOString()),
    db.from('audit_events').select('*', { count: 'exact', head: true }).eq('status', 'rate_limited').gte('created_at', todayStart.toISOString()),
    db.from('audit_events').select('actor_type, event_type, status, reason_code, created_at, anon_token_hash').order('created_at', { ascending: false }).limit(20),
  ])

  // Plan breakdown
  const plans = { free: 0, pro: 0 }
  planBreakdown?.forEach((p) => {
    if (p.plan === 'pro') plans.pro++
    else plans.free++
  })

  // Mode breakdown
  const modes = { quick: 0, recommend: 0, custom: 0 }
  modeBreakdown?.forEach((l) => {
    if (l.mode in modes) modes[l.mode as keyof typeof modes]++
  })

  // Anon creates today
  const anonCreatesToday = anonToday?.reduce((sum, row) => sum + (row.create_count || 0), 0) ?? 0

  return {
    users: {
      total: totalUsers ?? 0,
      today: newUsersToday ?? 0,
      week: newUsersWeek ?? 0,
      month: newUsersMonth ?? 0,
      plans,
    },
    links: {
      total: totalLinks ?? 0,
      today: linksToday ?? 0,
      week: linksWeek ?? 0,
      month: linksMonth ?? 0,
      anon: anonLinks ?? 0,
      modes,
      top: topLinks ?? [],
    },
    anon: {
      createsToday: anonCreatesToday,
    },
    audit: {
      blockedToday: blockedToday ?? 0,
      rateLimitedToday: rateLimitedToday ?? 0,
      recent: recentAudit ?? [],
    },
  }
}

export default async function AdminDashboardPage() {
  const authed = await isAdminAuthenticated()
  if (!authed) redirect('/admin')

  const stats = await fetchStats()

  return <AdminDashboardClient stats={stats} />
}
