import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react'
import AdminPanel from './AdminPanel'
import { supabase, supabaseConfigured } from './supabase'
import type { AdminProfile } from './supabase'

export default function AdminAuth() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let active = true
    async function loadProfile() {
      if (!supabase || !session?.user) { if (active) { setProfile(null); setLoading(false) }; return }
      setLoading(true)
      const { data, error: profileError } = await supabase.from('profiles').select('id,email,display_name,role').eq('id', session.user.id).maybeSingle()
      if (active) {
        setProfile(data as AdminProfile | null)
        setError(profileError?.message || '')
        setLoading(false)
      }
    }
    loadProfile()
    return () => { active = false }
  }, [session])

  async function signIn(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError(error.message); setLoading(false) }
  }

  if (!supabaseConfigured) return <div className="auth-screen"><div className="auth-card"><div className="auth-logo">O</div><h1>Supabase sozlanmagan</h1><p>.env.local faylida VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY qiymatlarini kiriting, so‘ng serverni qayta ishga tushiring.</p></div></div>
  if (loading) return <div className="auth-screen"><div className="auth-loading">OUTPOST UZ · XAVFSIZ ADMIN KIRISH</div></div>
  if (!session) return <div className="auth-screen"><form className="auth-card" onSubmit={signIn}><div className="auth-logo">O</div><div className="auth-eyebrow">OUTPOST UZ / CONTROL CENTER</div><h1>Admin panelga kirish</h1><p>Davom etish uchun administrator hisobingiz bilan kiring.</p><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username" placeholder="admin@outpost.uz"/></label><label>Parol<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••••"/></label>{error&&<div className="auth-error">{error}</div>}<button className="auth-submit" disabled={loading}><LogIn size={16}/> Kirish</button><small><LockKeyhole size={13}/> Faqat taklif qilingan administratorlar uchun</small></form></div>
  if (!profile) return <div className="auth-screen"><div className="auth-card"><div className="auth-logo"><ShieldCheck/></div><h1>Ruxsat berilmagan</h1><p>Hisobingiz tizimga kirdi, lekin OUTPOST UZ administratorlar ro‘yxatida topilmadi. Super Admin sizga rol biriktirishi kerak.</p><button className="auth-submit" onClick={()=>supabase!.auth.signOut()}>Chiqish</button>{error&&<small className="auth-error">{error}</small>}</div></div>
  return <AdminPanel profile={profile} onSignOut={()=>supabase!.auth.signOut()} />
}
