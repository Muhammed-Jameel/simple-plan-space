import { supabase } from './supabase'

// ─── localStorage storage (works for everyone, no account needed) ───
const localGet = (key) => {
  try {
    const val = localStorage.getItem('fps_' + key)
    return val ? { key, value: val } : null
  } catch { return null }
}

const localSet = (key, value) => {
  try {
    localStorage.setItem('fps_' + key, value)
    return { key, value }
  } catch { return null }
}

const localDelete = (key) => {
  try {
    localStorage.removeItem('fps_' + key)
    return { key, deleted: true }
  } catch { return null }
}

// ─── Supabase storage (for logged-in users, syncs across devices) ───
const supaGet = async (key, userId) => {
  if (!supabase || !userId) return localGet(key)
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('value')
      .eq('key', key)
      .eq('user_id', userId)
      .single()
    if (error || !data) return localGet(key) // fallback
    return { key, value: data.value }
  } catch { return localGet(key) }
}

const supaSet = async (key, value, userId) => {
  if (!supabase || !userId) return localSet(key, value)
  try {
    const { error } = await supabase
      .from('projects')
      .upsert({ key, value, user_id: userId, updated_at: new Date().toISOString() },
        { onConflict: 'key,user_id' })
    if (error) console.error('Supabase save error:', error)
    // Also save locally as cache
    localSet(key, value)
    return { key, value }
  } catch { return localSet(key, value) }
}

const supaDelete = async (key, userId) => {
  if (!supabase || !userId) return localDelete(key)
  try {
    await supabase.from('projects').delete().eq('key', key).eq('user_id', userId)
    localDelete(key)
    return { key, deleted: true }
  } catch { return localDelete(key) }
}

// ─── Sync: migrate localStorage data to Supabase on first login ───
export const syncLocalToSupabase = async (userId) => {
  if (!supabase || !userId) return
  try {
    // Find all fps_ keys in localStorage
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('fps_')) keys.push(k.slice(4)) // remove prefix
    }
    // Upsert each to Supabase
    for (const key of keys) {
      const val = localStorage.getItem('fps_' + key)
      if (val) {
        await supabase.from('projects').upsert(
          { key, value: val, user_id: userId, updated_at: new Date().toISOString() },
          { onConflict: 'key,user_id' }
        )
      }
    }
  } catch (e) { console.error('Sync error:', e) }
}

// ─── Pull: download Supabase data to localStorage ───
export const syncSupabaseToLocal = async (userId) => {
  if (!supabase || !userId) return
  try {
    const { data } = await supabase
      .from('projects')
      .select('key, value')
      .eq('user_id', userId)
    if (data) {
      data.forEach(row => {
        localStorage.setItem('fps_' + row.key, row.value)
      })
    }
  } catch (e) { console.error('Pull error:', e) }
}

// ─── Create storage object that matches window.storage API ───
export function createStorage(userId) {
  return {
    get: (key) => userId ? supaGet(key, userId) : Promise.resolve(localGet(key)),
    set: (key, value) => userId ? supaSet(key, value, userId) : Promise.resolve(localSet(key, value)),
    delete: (key) => userId ? supaDelete(key, userId) : Promise.resolve(localDelete(key)),
  }
}
