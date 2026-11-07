import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { AdminProfile } from './supabase'
import { supabase } from './supabase'
import {
  Activity, ArrowLeft, BookOpen, Boxes, Check, ChevronRight, FileImage, Database, Megaphone,
  FilePlus2, Globe, LayoutDashboard, Map, Menu, Plus, Search, Settings,
  ShieldCheck, Trash2, Users, X, Clock3, RefreshCw, AlertCircle
} from 'lucide-react'

type Status = 'Draft' | 'Published'
type StaffRow = { id: string; email: string; display_name: string | null; role: AdminProfile['role']; created_at: string }
type ActivityRow = { id: string; actor_email: string | null; action: string; entity_type: string; entity_title: string | null; details: any; created_at: string }
type SettingRow = { key: string; value: any; description: string | null; updated_at: string }
type AdRow = { id: string; title: string; image_url: string; target_url: string; placement: string; is_active: boolean; starts_at: string | null; ends_at: string | null; impressions: number; clicks: number; created_at: string }
type ContentType = 'Item' | 'Weapon' | 'Monument' | 'Guide' | 'Recipe'
type Content = {
  id: string
  title: string
  slug: string
  type: ContentType
  category: string
  status: Status
  updated: string
  description: string
  body: Record<string, unknown>
}

const nav = [
  ['Dashboard', LayoutDashboard], ['Kontent', BookOpen], ['Monumentlar', Map], ['O‘yin ma’lumotlari', Database],
  ['Wiki itemlar', Boxes], ['Media Library', FileImage], ['Adminlar va rollar', Users],
  ['Faoliyat tarixi', Activity], ['Reklamalar', Megaphone], ['Sozlamalar', Settings]
] as const

function makeSlug(value: string) {
  return value.toLowerCase().trim()
    .replace(/[ʻ’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `content-${Date.now()}`
}
function fromDb(row: any): Content {
  return {
    id: row.id, title: row.title, slug: row.slug,
    type: row.content_type === 'weapon' ? 'Weapon' : row.content_type === 'monument' ? 'Monument' : row.content_type === 'guide' ? 'Guide' : row.content_type === 'recipe' ? 'Recipe' : 'Item',
    category: row.category || '', status: row.status === 'published' ? 'Published' : 'Draft',
    updated: row.updated_at ? new Date(row.updated_at).toLocaleString('uz-UZ') : '—',
    description: row.description || '', body: row.body || {}
  }
}
function toDbType(type: ContentType) {
  return type === 'Weapon' ? 'weapon' : type === 'Monument' ? 'monument' : type === 'Guide' ? 'guide' : type === 'Recipe' ? 'recipe' : 'item'
}

export default function AdminPanel({ profile, onSignOut }: { profile: AdminProfile; onSignOut: () => void }) {
  const [section, setSection] = useState('Dashboard')
  const [rows, setRows] = useState<Content[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Barchasi')
  const [editing, setEditing] = useState<Content | null>(null)
  const [form, setForm] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mediaFiles, setMediaFiles] = useState<any[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const gameDataOptions = [
    { key: 'raid_targets', label: 'Raid Calculator — nishonlar', hint: 'HP va C4, Rocket, Satchel, Explosive Ammo, Beancan miqdorlari' },
    { key: 'raid_methods', label: 'Raid Calculator — usullar', hint: 'Raid usullari va sulfur sarfi' },
    { key: 'craft_recipes', label: 'Craft — retseptlar', hint: 'Ingredientlar, miqdorlar, Workbench va tayyorlash vaqti' },
    { key: 'recycler_items', label: 'Recycler — buyumlar', hint: 'Qayta ishlashdan chiqadigan resurslar' },
    { key: 'recycler_rates', label: 'Recycler — tezlik profillari', hint: 'Recycler samaradorligi va ishlash vaqti' }
  ]
  const [gameDataKey, setGameDataKey] = useState('raid_targets')
  const [gameDataJson, setGameDataJson] = useState('[]')
  const [gameDataRows, setGameDataRows] = useState<Record<string, any>>({})
  const [gameDataLoading, setGameDataLoading] = useState(false)
  const [gameDataSaving, setGameDataSaving] = useState(false)
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffSaving, setStaffSaving] = useState<string | null>(null)
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityFilter, setActivityFilter] = useState('all')
  const [settingsRows, setSettingsRows] = useState<SettingRow[]>([])
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({})
  const [ads, setAds] = useState<AdRow[]>([])
  const [adsLoading, setAdsLoading] = useState(false)
  const [adSaving, setAdSaving] = useState(false)
  const [editingAd, setEditingAd] = useState<AdRow | null>(null)
  const [adFormOpen, setAdFormOpen] = useState(false)

  const role = profile.role
  const canPublish = role !== 'contributor'
  const canDelete = role === 'super_admin' || role === 'admin'

  async function loadContent() {
    if (!supabase) { setError('Supabase ulanishi topilmadi. .env.local sozlamalarini tekshiring.'); setLoading(false); return }
    setLoading(true); setError('')
    const { data, error: dbError } = await supabase
      .from('content_entries')
      .select('id,title,slug,content_type,category,description,body,status,updated_at')
      .order('updated_at', { ascending: false })
    if (dbError) setError(`Kontentni yuklab bo‘lmadi: ${dbError.message}`)
    else setRows((data || []).map(fromDb))
    setLoading(false)
  }

  useEffect(() => { void loadContent() }, [])

  const drafts = rows.filter(x => x.status === 'Draft').length
  const published = rows.length - drafts
  const filtered = useMemo(() => rows.filter(x =>
    (filter === 'Barchasi' || x.status === filter) &&
    `${x.title} ${x.type} ${x.category}`.toLowerCase().includes(query.toLowerCase())
  ), [rows, filter, query])

  const edit = (row: Content | null) => {
    setEditing(row); setForm(true); setError(''); setNotice('')
    setImagePreview(typeof row?.body?.image_url === 'string' ? row.body.image_url : '')
  }

  async function loadMedia() {
    if (!supabase) return
    setMediaLoading(true); setError('')
    const { data, error: mediaError } = await supabase.storage.from('outpost-media').list('', {
      limit: 100, sortBy: { column: 'created_at', order: 'desc' }
    })
    if (mediaError) setError(`Media Library yuklanmadi: ${mediaError.message}`)
    else setMediaFiles((data || []).filter(x => x.name).map(x => {
      const { data: publicData } = supabase.storage.from('outpost-media').getPublicUrl(x.name)
      return { ...x, url: publicData.publicUrl }
    }))
    setMediaLoading(false)
  }

  async function loadGameData() {
    if (!supabase) return
    setGameDataLoading(true)
    const { data, error: loadError } = await supabase.from('game_data').select('data_key,value,updated_at')
    if (loadError) setError(`O‘yin ma’lumotlari yuklanmadi: ${loadError.message}`)
    else {
      const mapped: Record<string, any> = {}
      ;(data || []).forEach((row: any) => { mapped[row.data_key] = row })
      setGameDataRows(mapped)
      const selected = mapped[gameDataKey]?.value
      setGameDataJson(JSON.stringify(Array.isArray(selected) ? selected : [], null, 2))
    }
    setGameDataLoading(false)
  }

  async function saveGameData() {
    if (!supabase || role === 'contributor') return
    setError(''); setNotice('')
    let parsed: any
    try { parsed = JSON.parse(gameDataJson) } catch { setError('JSON formati xato. Vergul, qavs va qo‘shtirnoqlarni tekshiring.'); return }
    if (!Array.isArray(parsed) || parsed.length === 0) { setError('Ma’lumotlar bo‘sh bo‘lmasligi va JSON array bo‘lishi kerak.'); return }
    setGameDataSaving(true)
    const { error: saveError } = await supabase.from('game_data').upsert({
      data_key: gameDataKey, value: parsed, updated_by: profile.id, updated_at: new Date().toISOString()
    }, { onConflict: 'data_key' })
    if (saveError) setError(`Saqlashda xatolik: ${saveError.message}`)
    else {
      setGameDataRows(old => ({ ...old, [gameDataKey]: { data_key: gameDataKey, value: parsed, updated_at: new Date().toISOString() } }))
      setNotice('O‘yin ma’lumotlari Supabase bazasiga saqlandi. Saytni yangilang — yangi qiymatlar ishlaydi.')
    }
    setGameDataSaving(false)
  }

  async function loadStaff() {
    if (!supabase || role !== 'super_admin' && role !== 'admin') return
    setStaffLoading(true); setError('')
    const { data, error: loadError } = await supabase.from('profiles')
      .select('id,email,display_name,role,created_at').order('created_at', { ascending: true })
    if (loadError) setError(`Adminlar ro‘yxati yuklanmadi: ${loadError.message}`)
    else setStaff((data || []) as StaffRow[])
    setStaffLoading(false)
  }

  async function changeStaffRole(member: StaffRow, nextRole: AdminProfile['role']) {
    if (!supabase || role !== 'super_admin' || member.id === profile.id) return
    if (!confirm(`${member.email} rolini ${nextRole.replaceAll('_', ' ')} ga o‘zgartirasizmi?`)) return
    setStaffSaving(member.id); setError(''); setNotice('')
    const { error: updateError } = await supabase.from('profiles').update({ role: nextRole }).eq('id', member.id)
    if (updateError) setError(`Rolni o‘zgartirib bo‘lmadi: ${updateError.message}`)
    else { setStaff(old => old.map(x => x.id === member.id ? { ...x, role: nextRole } : x)); setNotice(`${member.email} roli yangilandi.`) }
    setStaffSaving(null)
  }

  async function loadActivity() {
    if (!supabase) return
    setActivityLoading(true); setError('')
    const { data, error: loadError } = await supabase.from('activity_logs')
      .select('id,actor_email,action,entity_type,entity_title,details,created_at')
      .order('created_at', { ascending: false }).limit(150)
    if (loadError) setError(`Faoliyat tarixi yuklanmadi: ${loadError.message}`)
    else setActivityRows((data || []) as ActivityRow[])
    setActivityLoading(false)
  }

  async function loadAds() {
    if (!supabase) return
    setAdsLoading(true); setError('')
    const { data, error: loadError } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false })
    if (loadError) setError(`Reklamalar yuklanmadi: ${loadError.message}`)
    else setAds((data || []) as AdRow[])
    setAdsLoading(false)
  }

  async function saveAd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase || role === 'contributor') return
    setAdSaving(true); setError(''); setNotice('')
    const f = new FormData(e.currentTarget)
    const title = String(f.get('ad_title') || '').trim()
    const targetUrl = String(f.get('target_url') || '').trim()
    let imageUrl = String(f.get('image_url') || '').trim()
    const file = f.get('ad_image') as File | null
    if (!title || !targetUrl) { setError('Reklama nomi va havolasi majburiy.'); setAdSaving(false); return }
    if (file && file.size > 0) {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      const maxBannerBytes = 20 * 1024 * 1024
      if (!allowedImageTypes.includes(file.type)) { setError('Banner uchun JPG, PNG, WEBP yoki GIF rasm tanlang.'); setAdSaving(false); return }
      if (file.size > maxBannerBytes) { setError('Banner hajmi 20 MB dan oshmasligi kerak. Kattaroq rasmni siqib qayta yuklang.'); setAdSaving(false); return }
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeName = `ads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
      const { error: uploadError } = await supabase.storage.from('outpost-media').upload(safeName, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
      if (uploadError) { setError(`Banner yuklanmadi: ${uploadError.message}. Supabase'da v1.8 SQL migratsiyasi bajarilganini tekshiring.`); setAdSaving(false); return }
      imageUrl = supabase.storage.from('outpost-media').getPublicUrl(safeName).data.publicUrl
    }
    if (!imageUrl) { setError('Banner rasmi URL yoki fayl orqali kiritilishi kerak.'); setAdSaving(false); return }
    const payload = {
      title, image_url: imageUrl, target_url: targetUrl,
      placement: String(f.get('placement') || 'home_top'),
      is_active: f.get('is_active') === 'on',
      starts_at: String(f.get('starts_at') || '') || null,
      ends_at: String(f.get('ends_at') || '') || null,
      updated_by: profile.id
    }
    const result = editingAd
      ? await supabase.from('advertisements').update(payload).eq('id', editingAd.id).select().single()
      : await supabase.from('advertisements').insert(payload).select().single()
    if (result.error) setError(`Reklama saqlanmadi: ${result.error.message}`)
    else { setNotice('Reklama saqlandi. Ommaviy saytda ko‘rinishi uchun faol holatni yoqing.'); setAdFormOpen(false); setEditingAd(null); await loadAds() }
    setAdSaving(false)
  }

  async function toggleAd(ad: AdRow) {
    if (!supabase || role === 'contributor') return
    const { error: updateError } = await supabase.from('advertisements').update({ is_active: !ad.is_active, updated_by: profile.id }).eq('id', ad.id)
    if (updateError) setError(`Reklama holati o‘zgarmadi: ${updateError.message}`)
    else setAds(old => old.map(x => x.id === ad.id ? { ...x, is_active: !x.is_active } : x))
  }

  async function deleteAd(ad: AdRow) {
    if (!supabase || !canDelete || !confirm(`“${ad.title}” reklamasini o‘chirasizmi?`)) return
    const { error: deleteError } = await supabase.from('advertisements').delete().eq('id', ad.id)
    if (deleteError) setError(`Reklama o‘chirilmadi: ${deleteError.message}`)
    else { setAds(old => old.filter(x => x.id !== ad.id)); setNotice('Reklama o‘chirildi.') }
  }

  async function loadSettings() {
    if (!supabase) return
    setSettingsLoading(true); setError('')
    const { data, error: loadError } = await supabase.from('site_settings')
      .select('key,value,description,updated_at').order('key')
    if (loadError) setError(`Sozlamalar yuklanmadi: ${loadError.message}`)
    else {
      const rows = (data || []) as SettingRow[]
      setSettingsRows(rows)
      const draft: Record<string, string> = {}
      rows.forEach(row => { draft[row.key] = typeof row.value === 'string' ? row.value : JSON.stringify(row.value, null, 2) })
      setSettingsDraft(draft)
    }
    setSettingsLoading(false)
  }

  async function saveSettings() {
    if (!supabase || role === 'contributor') return
    setSettingsSaving(true); setError(''); setNotice('')
    try {
      const payload = settingsRows.map(row => {
        const raw = settingsDraft[row.key] ?? ''
        let value: any = raw
        if (typeof row.value !== 'string') {
          try { value = JSON.parse(raw) } catch { throw new Error(`${row.key}: JSON formati noto‘g‘ri`) }
        }
        return { key: row.key, value, description: row.description, updated_by: profile.id, updated_at: new Date().toISOString() }
      })
      for (const item of payload) {
        const { error: saveError } = await supabase.from('site_settings').upsert(item, { onConflict: 'key' })
        if (saveError) throw saveError
      }
      setNotice('Sayt sozlamalari Supabase bazasiga saqlandi.')
      await loadSettings()
    } catch (saveError: any) { setError(`Sozlamalarni saqlab bo‘lmadi: ${saveError.message}`) }
    setSettingsSaving(false)
  }

  useEffect(() => { if (section === 'Adminlar va rollar') void loadStaff() }, [section])
  useEffect(() => { if (section === 'Faoliyat tarixi') void loadActivity() }, [section])
  useEffect(() => { if (section === 'Sozlamalar') void loadSettings() }, [section])
  useEffect(() => { if (section === 'Reklamalar') void loadAds() }, [section])
  useEffect(() => { if (section === 'Media Library') void loadMedia() }, [section])
  useEffect(() => { if (section === 'O‘yin ma’lumotlari') void loadGameData() }, [section])
  useEffect(() => {
    const selected = gameDataRows[gameDataKey]?.value
    setGameDataJson(JSON.stringify(Array.isArray(selected) ? selected : [], null, 2))
  }, [gameDataKey, gameDataRows])

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true); setError(''); setNotice('')
    const f = new FormData(e.currentTarget)
    const title = String(f.get('title') || '').trim()
    const category = String(f.get('category') || '').trim()
    const description = String(f.get('description') || '').trim()
    const type = String(f.get('type') || 'Item') as ContentType
    const slug = makeSlug(String(f.get('slug') || title))
    const imageFile = f.get('image_file') as File | null
    let imageUrl = String(f.get('image_url') || '').trim()
    if (imageFile && imageFile.size > 0) {
      if (!imageFile.type.startsWith('image/')) { setError('Faqat rasm fayllarini yuklash mumkin.'); setSaving(false); return }
      if (imageFile.size > 5 * 1024 * 1024) { setError('Rasm hajmi 5 MB dan oshmasligi kerak.'); setSaving(false); return }
      const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const filePath = `content/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('outpost-media').upload(filePath, imageFile, { contentType: imageFile.type, upsert: false })
      if (uploadError) { setError(`Rasm yuklanmadi: ${uploadError.message}. Storage bucket sozlamasini tekshiring.`); setSaving(false); return }
      imageUrl = supabase.storage.from('outpost-media').getPublicUrl(filePath).data.publicUrl
    }
    const nextBody = { ...(editing?.body || {}) } as Record<string, unknown>
    if (f.get('remove_image') === 'on') delete nextBody.image_url
    else if (imageUrl) nextBody.image_url = imageUrl
    const payload = {
      title, slug, content_type: toDbType(type), category, description,
      body: nextBody,
      updated_by: profile.id,
      ...(editing ? {} : { created_by: profile.id, status: 'draft' })
    }
    const result = editing
      ? await supabase.from('content_entries').update(payload).eq('id', editing.id).select('id,title,slug,content_type,category,description,body,status,updated_at').single()
      : await supabase.from('content_entries').insert(payload).select('id,title,slug,content_type,category,description,body,status,updated_at').single()
    if (result.error) setError(`Saqlashda xatolik: ${result.error.message}`)
    else {
      const saved = fromDb(result.data)
      setRows(old => editing ? old.map(x => x.id === saved.id ? saved : x) : [saved, ...old])
      setForm(false); setEditing(null); setNotice(editing ? 'O‘zgarishlar bazaga saqlandi.' : 'Yangi kontent Draft sifatida bazaga saqlandi.')
    }
    setSaving(false)
  }

  async function setStatus(row: Content, status: Status) {
    if (!supabase) return
    if (status === 'Published' && !canPublish) { setError('Sizda Publish huquqi yo‘q.'); return }
    setError(''); setNotice('')
    const { data, error: dbError } = await supabase.from('content_entries')
      .update({ status: status === 'Published' ? 'published' : 'draft', updated_by: profile.id, ...(status === 'Published' ? { published_at: new Date().toISOString() } : { published_at: null }) })
      .eq('id', row.id)
      .select('id,title,slug,content_type,category,description,body,status,updated_at')
      .single()
    if (dbError) setError(`Statusni o‘zgartirib bo‘lmadi: ${dbError.message}`)
    else { const saved = fromDb(data); setRows(old => old.map(x => x.id === row.id ? saved : x)); setNotice(status === 'Published' ? 'Kontent Publish qilindi.' : 'Kontent Draft holatiga qaytarildi.') }
  }

  async function remove(row: Content) {
    if (!supabase || !canDelete) return
    if (!confirm(`“${row.title}” yozuvini butunlay o‘chirasizmi? Bu amalni ortga qaytarib bo‘lmaydi.`)) return
    const { error: dbError } = await supabase.from('content_entries').delete().eq('id', row.id)
    if (dbError) setError(`O‘chirishda xatolik: ${dbError.message}`)
    else { setRows(old => old.filter(x => x.id !== row.id)); setNotice('Kontent bazadan o‘chirildi.') }
  }

  const table = (data: Content[]) => <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>NOMI</th><th>TURI</th><th>HOLATI</th><th>YANGILANGAN</th><th>AMALLAR</th></tr></thead><tbody>
    {data.map(x => <tr key={x.id}><td><b>{x.title}</b><small>{x.category || x.slug}</small></td><td>{x.type}</td><td><span className={`admin-status ${x.status === 'Published' ? 'published' : 'draft'}`}><i />{x.status}</span></td><td>{x.updated}</td><td><div className="admin-row-actions"><button onClick={() => edit(x)}>Tahrir</button>{x.status === 'Draft' ? (canPublish ? <button className="publish-action" onClick={() => void setStatus(x, 'Published')}><Check size={13} /> Publish</button> : <button disabled title="Publish huquqi yo‘q">Kutilmoqda</button>) : <button onClick={() => void setStatus(x, 'Draft')}>Unpublish</button>}{canDelete && <button className="delete-action" onClick={() => void remove(x)}><Trash2 size={13} /></button>}</div></td></tr>)}
    {!data.length && <tr><td colSpan={5} className="admin-empty">{loading ? 'Yuklanmoqda...' : 'Bazadan kontent topilmadi. Birinchi yozuvni qo‘shing.'}</td></tr>}
  </tbody></table></div>

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobile ? 'admin-sidebar-open' : ''}`}>
      <a className="admin-brand" href="/"><span className="brand-mark">O</span><span>OUTPOST<span className="brand-muted"> UZ</span><small>CONTROL CENTER</small></span></a>
      <div className="admin-side-label">WORKSPACE</div>
      {nav.map(([label, Icon]) => <button key={label} className={`admin-nav-item ${section === label ? 'active' : ''}`} onClick={() => { setSection(label); setMobile(false) }}><Icon size={17} />{label}{label === 'Kontent' && drafts > 0 ? <em>{drafts}</em> : null}</button>)}
      <div className="admin-sidebar-bottom"><div className="admin-user"><div className="admin-avatar">{(profile.display_name || profile.email).slice(0, 2).toUpperCase()}</div><div><b>{profile.display_name || profile.email}</b><small>{role.replaceAll('_', ' ')}</small></div><button className="admin-signout" onClick={onSignOut} title="Chiqish">Chiqish</button></div><a href="/" className="admin-back"><ArrowLeft size={15} /> Saytga qaytish</a></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><button className="admin-mobile-menu" onClick={() => setMobile(!mobile)}><Menu size={19} /></button><div className="admin-breadcrumb">OUTPOST UZ <ChevronRight size={13} /><b>{section}</b></div><div className="admin-top-actions"><span className="admin-env"><i /> SUPABASE LIVE</span><button onClick={() => void loadContent()} title="Yangilash"><RefreshCw size={16} /></button><div className="admin-avatar">{(profile.display_name || profile.email).slice(0, 2).toUpperCase()}</div></div></header>
      <div className="admin-content">
        <div className="admin-page-heading"><div><div className="admin-eyebrow">CONTROL CENTER / {section.toUpperCase()}</div><h1>{section === 'Dashboard' ? 'Dashboard' : section}</h1><p>{section === 'Dashboard' ? 'OUTPOST UZ loyihasining umumiy holati va kontent boshqaruvi.' : 'Kontentni boshqaring, tekshiring va ommaga chiqarishga tayyorlang.'}</p></div>{['Kontent','Monumentlar','Wiki itemlar'].includes(section) && <button className="admin-primary" onClick={() => edit(null)}><Plus size={16} /> Yangi kontent</button>}</div>
        {error && <div className="admin-demo-warning"><AlertCircle size={17} /><span>{error}</span></div>}
        {notice && <div className="admin-role-note"><ShieldCheck size={17} /><span>{notice}</span></div>}
        {section === 'Dashboard' ? <>
          <div className="admin-stat-grid"><div className="admin-stat-card"><span>JAMI KONTENT</span><div><b>{loading ? '…' : rows.length}</b><BookOpen /></div><small>Supabase bazasidagi yozuvlar</small></div><div className="admin-stat-card"><span>PUBLISHED</span><div><b>{loading ? '…' : published}</b><Globe /></div><small>Ommaga chiqarilgan holat</small></div><div className="admin-stat-card"><span>DRAFTLAR</span><div><b>{loading ? '…' : drafts}</b><FilePlus2 /></div><small>Tekshirishni kutmoqda</small></div><div className="admin-stat-card"><span>ADMIN ROLI</span><div><b>{role === 'super_admin' ? '1' : role}</b><ShieldCheck /></div><small>{role.replaceAll('_', ' ')}</small></div></div>
          <div className="admin-dashboard-grid"><section className="admin-panel-card"><div className="admin-card-heading"><div><h2>So‘nggi kontent</h2><p>Supabase bazasidan yuklandi</p></div><button onClick={() => setSection('Kontent')}>Barchasi <ChevronRight size={14} /></button></div>{table(rows.slice(0, 5))}</section><section className="admin-panel-card"><div className="admin-card-heading"><div><h2>Tezkor amallar</h2><p>Kontent boshqaruvini boshlang</p></div></div><div className="admin-quick-actions"><button onClick={() => edit(null)}><FilePlus2 /><span><b>Yangi Wiki item</b><small>Item yoki qurol qo‘shish</small></span><ChevronRight /></button><button onClick={() => setSection('Monumentlar')}><Map /><span><b>Monumentlar</b><small>Xarita va puzzle ma’lumotlari</small></span><ChevronRight /></button><button onClick={() => setSection('Media Library')}><FileImage /><span><b>Media Library</b><small>Rasm va fayllar</small></span><ChevronRight /></button></div><div className="admin-role-note"><ShieldCheck size={18} /><span><b>Haqiqiy backend ulandi</b><small>Kontent PostgreSQL bazasida saqlanadi.</small></span></div></section></div>
        </> : ['Kontent', 'Monumentlar', 'Wiki itemlar'].includes(section) ? <section className="admin-panel-card"><div className="admin-card-heading"><div><h2>{section === 'Kontent' ? 'Barcha kontent' : section}</h2><p>Draft holatidagi yozuvlar ommaviy saytda ko‘rinmaydi.</p></div></div><div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nomi yoki kategoriya bo‘yicha qidirish..." /></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>Barchasi</option><option>Draft</option><option>Published</option></select><button className="admin-primary" onClick={() => edit(null)}><Plus size={15} /> Qo‘shish</button></div>{table(filtered.filter(x => section === 'Monumentlar' ? x.type === 'Monument' : section === 'Wiki itemlar' ? ['Item', 'Weapon'].includes(x.type) : true))}</section> : section === 'O‘yin ma’lumotlari' ? <section className="admin-panel-card game-data-panel"><div className="admin-card-heading"><div><h2>O‘yin ma’lumotlari boshqaruvi</h2><p>Bu yerdagi o‘zgarishlar Raid Calculator, Craft va Recycler bo‘limlariga ulanadi.</p></div><button className="admin-secondary" onClick={() => void loadGameData()}><RefreshCw size={14}/> Yangilash</button></div><div className="game-data-toolbar"><label>Ma’lumotlar to‘plami<select value={gameDataKey} onChange={e => setGameDataKey(e.target.value)}>{gameDataOptions.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}</select></label><div className="game-data-help">{gameDataOptions.find(x => x.key === gameDataKey)?.hint}</div></div><label className="game-data-json-label">JSON ma’lumotlari<textarea spellCheck={false} value={gameDataJson} onChange={e => setGameDataJson(e.target.value)} rows={22} /></label><div className="game-data-footer"><span>{gameDataLoading ? 'Bazadan yuklanmoqda…' : gameDataRows[gameDataKey]?.updated_at ? `Oxirgi yangilanish: ${new Date(gameDataRows[gameDataKey].updated_at).toLocaleString('uz-UZ')}` : 'Hali saqlanmagan boshlang‘ich ma’lumotlar'}</span><button className="admin-primary" disabled={gameDataSaving || gameDataLoading || role === 'contributor'} onClick={() => void saveGameData()}>{gameDataSaving ? 'Saqlanmoqda…' : 'O‘zgarishlarni saqlash'}</button></div><div className="admin-role-note"><ShieldCheck size={18}/><span><b>Maslahat</b><small>Avval JSON nusxasini saqlab qo‘ying. Noto‘g‘ri format saqlanmaydi. Bitta to‘plamni o‘zgartirib, saytni yangilab natijani tekshiring.</small></span></div></section> : section === 'Media Library' ? <section className="admin-panel-card"><div className="admin-card-heading"><div><h2>Media Library</h2><p>Supabase Storage'dagi rasmlar. Kontent tahririda rasm tanlashingiz yoki URL kiritishingiz mumkin.</p></div><button className="admin-secondary" onClick={() => void loadMedia()}><RefreshCw size={14}/> Yangilash</button></div><div className="admin-media-grid">{mediaLoading ? <p>Yuklanmoqda...</p> : mediaFiles.map(file => <div className="admin-media-tile" key={file.name}><img src={file.url} alt={file.name}/><small title={file.name}>{file.name}</small><button type="button" onClick={() => { void navigator.clipboard?.writeText(file.url); setNotice('Rasm URL manzili nusxalandi.') }}>URL nusxalash</button></div>)}{!mediaLoading && mediaFiles.length === 0 && <p className="admin-empty">Hozircha rasm yo‘q. Yangi kontent yaratishda rasm yuklang.</p>}</div></section> : section === 'Adminlar va rollar' ? <section className="admin-panel-card"><div className="admin-card-heading"><div><h2>Adminlar va rollar</h2><p>Supabase Auth orqali ro‘yxatdan o‘tgan foydalanuvchilarga rol biriktiring.</p></div><button className="admin-secondary" onClick={() => void loadStaff()}><RefreshCw size={14}/> Yangilash</button></div><div className="admin-role-note"><ShieldCheck size={18}/><span><b>Yangi admin qo‘shish</b><small>Avval Supabase → Authentication → Users bo‘limidan foydalanuvchini Invite qiling. U tizimga birinchi marta kirgach, shu yerda rolini belgilang. Faqat Super Admin rollarni o‘zgartira oladi.</small></span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>FOYDALANUVCHI</th><th>ROL</th><th>QO‘SHILGAN</th><th>AMAL</th></tr></thead><tbody>{staff.map(member=><tr key={member.id}><td><b>{member.display_name || member.email}</b><small>{member.email}{member.id===profile.id?' · Siz':''}</small></td><td><span className="admin-status published">{member.role.replaceAll('_',' ')}</span></td><td>{member.created_at?new Date(member.created_at).toLocaleDateString('uz-UZ'):'—'}</td><td>{role==='super_admin' && member.id!==profile.id ? <div className="admin-row-actions"><select aria-label="Rolni tanlash" value={member.role} disabled={staffSaving===member.id} onChange={e=>void changeStaffRole(member,e.target.value as AdminProfile['role'])}><option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="contributor">Contributor</option></select></div> : <small>{member.id===profile.id?'O‘z rolingizni bu yerdan o‘zgartira olmaysiz':'Faqat Super Admin'}</small>}</td></tr>)}{!staff.length&&<tr><td colSpan={4} className="admin-empty">{staffLoading?'Yuklanmoqda…':'Foydalanuvchi topilmadi yoki ruxsat yetarli emas.'}</td></tr>}</tbody></table></div></section> : section === 'Faoliyat tarixi' ? <section className="admin-panel-card"><div className="admin-card-heading"><div><h2>Faoliyat tarixi</h2><p>Kontent, o‘yin ma’lumotlari, rollar va sozlamalar bo‘yicha oxirgi 150 ta amal.</p></div><button className="admin-secondary" onClick={() => void loadActivity()}><RefreshCw size={14}/> Yangilash</button></div><div className="admin-toolbar"><select value={activityFilter} onChange={e=>setActivityFilter(e.target.value)}><option value="all">Barcha amallar</option><option value="INSERT">Yaratildi</option><option value="UPDATE">Tahrirlandi</option><option value="DELETE">O‘chirildi</option></select></div><div className="admin-activity-list">{activityRows.filter(x=>activityFilter==='all'||x.action===activityFilter).map(item=><article className="admin-activity-row" key={item.id}><div className="admin-activity-icon"><Activity size={16}/></div><div className="admin-activity-main"><b>{item.entity_title || item.entity_type}</b><p>{item.action==='INSERT'?'Yaratildi':item.action==='UPDATE'?'Tahrirlandi':item.action==='DELETE'?'O‘chirildi':item.action} · {item.entity_type}</p><small>{item.actor_email || 'Tizim'} · {new Date(item.created_at).toLocaleString('uz-UZ')}</small>{item.details && Object.keys(item.details).length>0 && <details><summary>Batafsil</summary><pre>{JSON.stringify(item.details,null,2)}</pre></details>}</div></article>)}{!activityRows.length&&<p className="admin-empty">{activityLoading?'Yuklanmoqda…':'Hali faoliyat qayd etilmagan. SQL migratsiyasidan keyingi amallar shu yerda ko‘rinadi.'}</p>}</div></section> : section === 'Reklamalar' ? <section className="admin-panel-card"><div className="admin-card-heading"><div><h2>Reklama boshqaruvi</h2><p>Bannerlarni yarating, joylashuvini belgilang va ko‘rish/bosish statistikasini kuzating. Yangi reklama standart holatda o‘chiq bo‘ladi.</p></div><div className="admin-inline-actions"><button className="admin-secondary" onClick={() => void loadAds()}><RefreshCw size={14}/> Yangilash</button><button className="admin-primary" onClick={() => { setEditingAd(null); setAdFormOpen(true) }}><Plus size={15}/> Banner qo‘shish</button></div></div>
          {adFormOpen && <form key={editingAd?.id || 'new-ad'} className="admin-ad-form" onSubmit={saveAd}><div className="admin-ad-form-head"><b>{editingAd ? 'Reklamani tahrirlash' : 'Yangi reklama'}</b><button type="button" className="admin-secondary" onClick={() => { setAdFormOpen(false); setEditingAd(null) }}>Yopish</button></div><label>Reklama nomi<input name="ad_title" required defaultValue={editingAd?.title || ''} placeholder="Masalan: Rust server hosting"/></label><label>Banner rasmi URL<input name="image_url" defaultValue={editingAd?.image_url || ''} placeholder="https://... (yoki pastda fayl yuklang)"/></label><label>Yoki banner faylini yuklash<input name="ad_image" type="file" accept="image/jpeg,image/png,image/webp,image/gif"/><small>JPG, PNG, WEBP yoki GIF · maksimal 20 MB</small></label><label>Reklama havolasi<input name="target_url" type="url" required defaultValue={editingAd?.target_url || ''} placeholder="https://..."/></label><label>Joylashuv<select name="placement" defaultValue={editingAd?.placement || 'home_top'}><option value="home_top">Bosh sahifa — statistika ostida</option><option value="wiki_inline">Wiki — katalogdan oldin</option><option value="footer">Footer — sahifa pastida</option></select></label><div className="admin-ad-dates"><label>Boshlanish vaqti<input name="starts_at" type="datetime-local" defaultValue={editingAd?.starts_at ? new Date(editingAd.starts_at).toISOString().slice(0,16) : ''}/></label><label>Tugash vaqti<input name="ends_at" type="datetime-local" defaultValue={editingAd?.ends_at ? new Date(editingAd.ends_at).toISOString().slice(0,16) : ''}/></label></div><label className="admin-ad-active"><input type="checkbox" name="is_active" defaultChecked={editingAd?.is_active || false}/> Reklamani faollashtirish</label><div className="admin-modal-actions"><button className="admin-primary" disabled={adSaving || role==='contributor'}>{adSaving?'Saqlanmoqda…':'Reklamani saqlash'}</button></div></form>}
          <div className="admin-ad-grid">{adsLoading ? <p className="admin-empty">Reklamalar yuklanmoqda…</p> : ads.map(ad=><article className="admin-ad-card" key={ad.id}><img src={ad.image_url} alt={ad.title}/><div className="admin-ad-card-body"><div className="admin-ad-title"><b>{ad.title}</b><span className={`admin-status ${ad.is_active?'published':'draft'}`}>{ad.is_active?'Faol':'O‘chiq'}</span></div><small>{ad.placement==='home_top'?'Bosh sahifa':ad.placement==='wiki_inline'?'Wiki ichida':'Footer'}</small><div className="admin-ad-stats"><span><b>{ad.impressions.toLocaleString('uz-UZ')}</b> ko‘rish</span><span><b>{ad.clicks.toLocaleString('uz-UZ')}</b> bosish</span></div><div className="admin-row-actions"><button onClick={() => { setEditingAd(ad); setAdFormOpen(true) }}>Tahrirlash</button><button onClick={() => void toggleAd(ad)} disabled={role==='contributor'}>{ad.is_active?'O‘chirish':'Yoqish'}</button>{canDelete&&<button className="delete-action" onClick={() => void deleteAd(ad)}><Trash2 size={13}/></button>}</div></div></article>)}{!adsLoading&&!ads.length&&<p className="admin-empty">Hozircha reklama yo‘q. “Banner qo‘shish” orqali birinchi bannerni yarating.</p>}</div>
          <div className="admin-role-note"><ShieldCheck size={17}/><span><b>Joylashuvlar tayyor</b><small>Bosh sahifa, Wiki va Footer bannerlari qo‘llab-quvvatlanadi. Reklama ko‘rish/bosish hisoblagichlari SQL migratsiyasidan keyin ishlaydi. Saytda hozircha hech qanday reklama yo‘q.</small></span></div></section> : section === 'Sozlamalar' ? <section className="admin-panel-card"><div className="admin-card-heading"><div><h2>Sayt sozlamalari</h2><p>Saytning ommaviy ko‘rinishida ishlatiladigan umumiy qiymatlar.</p></div><button className="admin-secondary" onClick={()=>void loadSettings()}><RefreshCw size={14}/> Yangilash</button></div>{settingsLoading?<p className="admin-empty">Sozlamalar yuklanmoqda…</p>:<div className="admin-settings-list">{settingsRows.map(row=><label className="admin-setting-field" key={row.key}><span><b>{row.key.replaceAll('_',' ')}</b><small>{row.description || 'Sayt sozlamasi'}</small></span>{typeof row.value==='string' && row.value.length<180 ? <input value={settingsDraft[row.key]??''} onChange={e=>setSettingsDraft(old=>({...old,[row.key]:e.target.value}))}/> : <textarea rows={5} spellCheck={false} value={settingsDraft[row.key]??''} onChange={e=>setSettingsDraft(old=>({...old,[row.key]:e.target.value}))}/>}</label>)}{!settingsRows.length&&<p className="admin-empty">Sozlamalar topilmadi. v1.7 SQL migratsiyasini Supabase SQL Editor’da bajaring.</p>}<div className="admin-modal-actions"><button className="admin-primary" disabled={settingsSaving||settingsLoading||!settingsRows.length||role==='contributor'} onClick={()=>void saveSettings()}>{settingsSaving?'Saqlanmoqda…':'Sozlamalarni saqlash'}</button></div></div>}</section> : <section className="admin-panel-card admin-placeholder"><div className="admin-placeholder-icon"><Settings /></div><h2>{section}</h2><p>Ushbu modul hali sozlanmagan.</p></section>}
      </div>
    </main>
    {form && <div className="admin-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { setForm(false); setEditing(null) } }}><form className="admin-modal" onSubmit={save}>
      <div className="admin-modal-head"><div><span>CONTENT EDITOR / SUPABASE</span><h2>{editing ? 'Kontentni tahrirlash' : 'Yangi kontent yaratish'}</h2></div><button type="button" onClick={() => { setForm(false); setEditing(null) }}><X /></button></div>
      <label>Nomi<input name="title" defaultValue={editing?.title} required placeholder="Masalan: Thompson" /></label>
      <label>Slug<input name="slug" defaultValue={editing?.slug} placeholder="thompson (bo‘sh qoldirilsa nomdan olinadi)" /></label>
      <div className="admin-form-row"><label>Turi<select name="type" defaultValue={editing?.type || 'Item'}><option>Item</option><option>Weapon</option><option>Monument</option><option>Guide</option><option>Recipe</option></select></label><label>Kategoriya<input name="category" defaultValue={editing?.category} placeholder="Qurollar" /></label></div>
      <label>Tavsif<textarea name="description" defaultValue={editing?.description} rows={4} placeholder="Kontent haqida qisqacha ma’lumot..." /></label>
      <div className="admin-image-editor"><b><FileImage size={16}/> Rasm</b><label>Rasm faylini yuklash<input name="image_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { const file=e.target.files?.[0]; if(file) setImagePreview(URL.createObjectURL(file)) }}/><small>PNG, JPG, WEBP yoki GIF · maksimal 5 MB</small></label><label>Yoki rasm URL manzili<input name="image_url" defaultValue={typeof editing?.body?.image_url === 'string' ? editing.body.image_url : ''} placeholder="https://..." onChange={e => setImagePreview(e.target.value)}/></label>{imagePreview && <div className="admin-image-preview"><img src={imagePreview} alt="Rasm preview" onError={e => {e.currentTarget.style.opacity='0.25'}}/><span>Rasm ko‘rinishi</span></div>}{typeof editing?.body?.image_url === 'string' && <label className="admin-remove-image"><input type="checkbox" name="remove_image"/> Mavjud rasmni olib tashlash</label>}</div>
      <div className="admin-draft-hint"><Clock3 size={16} /> Yangi yozuv Draft sifatida Supabase bazasiga saqlanadi.</div>
      <div className="admin-modal-actions"><button type="button" className="admin-secondary" onClick={() => { setForm(false); setEditing(null) }}>Bekor qilish</button><button className="admin-primary" type="submit" disabled={saving}>{saving ? 'Saqlanmoqda…' : 'Draft saqlash'}</button></div>
    </form></div>}
  </div>
}
