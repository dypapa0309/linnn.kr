import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient as createSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH /api/links/[id]
 * Update a link (toggle active, soft delete).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabaseAuth = await createSupabaseClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Ensure the link belongs to the user
  const { data: existing } = await supabase
    .from('links')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: '링크를 찾을 수 없어요.' }, { status: 404 })
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: '권한이 없어요.' }, { status: 403 })
  }

  // Only allow safe field updates
  const allowedFields: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') allowedFields.is_active = body.is_active

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: '변경할 내용이 없어요.' }, { status: 400 })
  }

  allowedFields.updated_at = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('links')
    .update(allowedFields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: '업데이트에 실패했어요.' }, { status: 500 })
  }

  return NextResponse.json({ link: updated })
}

/**
 * DELETE /api/links/[id]
 * Soft-delete a link by deactivating it.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabaseAuth = await createSupabaseClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data: existing } = await supabase
    .from('links')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: '권한이 없어요.' }, { status: 403 })
  }

  // Soft delete: mark inactive and null out user_id reference
  await supabase
    .from('links')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
