import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && key)
export const supabase = supabaseConfigured ? createClient(url!, key!) : null

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'contributor'
export type AdminProfile = { id: string; email: string; display_name: string | null; role: AdminRole }
