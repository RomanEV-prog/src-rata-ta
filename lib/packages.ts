import { supabase } from './supabase'

export interface PackageRow {
  id: number
  name: string
  price: number | null
  includes: string[] | null
  image_url: string | null
  featured: boolean
  is_active: boolean
  sort_order: number
}

const CMS = 'https://cms.strelisce-maribor.si/uploads'

// Rezerva (če je Supabase prazen/nedosegljiv) — 4 osnovni paketi s slikami.
export const FALLBACK_PACKAGES: PackageRow[] = [
  { id: 101, name: 'Revolver', price: 74.5, includes: ['Revolver Alfa Proj, 6 nabojev', 'Revolver Uberti, 6 nabojev'], image_url: `${CMS}/revolver_c34f915501.jpeg`, featured: false, is_active: true, sort_order: 5 },
  { id: 103, name: 'Pištola / puška', price: 104.5, includes: ['Pištola Heckler & Koch, 10 nabojev', 'Pištola Glock, 10 nabojev', 'Šibrenica Huglu Atrox Tactical Plus, 2 naboja', 'Puška Winchester WILDCAT STRATA, 10 nabojev'], image_url: `${CMS}/PISTOLA_PUSKA_c8c2aa5b5e.png`, featured: true, is_active: true, sort_order: 3 },
  { id: 106, name: 'Tactical', price: 119.5, includes: ['Pištola Heckler & Koch, 15 nabojev', 'Pištola Glock, 15 nabojev', 'Puška PA VA-15 (AR-15), 20 nabojev'], image_url: `${CMS}/TACTICAL_dc15b8a69e.png`, featured: false, is_active: true, sort_order: 6 },
  { id: 108, name: 'Elite', price: 149, includes: ['Pištola Heckler & Koch, 20 nabojev', 'Pištola Glock, 20 nabojev', 'Puška PA VA-15 (AR-15), 30 nabojev', 'Puška Winchester WILDCAT STRATA, 20 nabojev'], image_url: `${CMS}/elite_3c90f03e92.png`, featured: false, is_active: true, sort_order: 8 },
]

/** Objavljeni paketi iz Supabase, urejeni po sort_order; rezerva ob napaki. */
export async function fetchPackages(): Promise<PackageRow[]> {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('id,name,price,includes,image_url,featured,is_active,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (!error && data && data.length > 0) return data as PackageRow[]
  } catch { /* preskoči na rezervo */ }
  return FALLBACK_PACKAGES
}

export function fmtPrice(p: number | null): string {
  if (p == null) return ''
  return p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
