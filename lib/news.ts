import { supabase } from './supabase'

export interface NewsPost {
  id: number
  title: string
  excerpt: string | null
  content: string | null
  category: string
  image_url: string | null
  slug: string | null
  published_at: number
}

const API = 'https://rangeos-api.adlerhub.eu'

/**
 * Pridobi objavljene novice. Vrstni red virov:
 *  1. Supabase (vedno dostopno — primarni vir, neodvisno od recepcijskega PC),
 *  2. RangeOS API (če Supabase prazen/nedosegljiv),
 *  3. null → klicatelj naj obdrži svoj trdi rezervni seznam.
 */
export async function fetchNews(): Promise<NewsPost[] | null> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('id,title,excerpt,content,category,image_url,slug,published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(50)
    if (!error && data && data.length > 0) return data as NewsPost[]
  } catch { /* preskoči na RangeOS */ }

  try {
    const r = await fetch(`${API}/public/news`)
    const b = await r.json()
    if (b.ok && Array.isArray(b.data) && b.data.length > 0) return b.data as NewsPost[]
  } catch { /* preskoči na rezervo */ }

  return null
}
