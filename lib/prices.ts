import { supabase } from './supabase'

export interface PriceItem {
  id: number
  section: string
  title: string
  subtitle: string | null
  price: number | null
  unit: string | null
  sort_order: number
  is_active: boolean
}

// Rezerva, če je Supabase nedosegljiv — zadnje znane vrednosti.
export const FALLBACK_PRICE_ITEMS: PriceItem[] = [
  { id: -1, section: 'Strelišče', title: 'Prisotnost inštruktorja', subtitle: 'Prisotnost inštruktorja ob streljanju', price: 37, unit: '/osebo', sort_order: 10, is_active: true },
  { id: -2, section: 'Strelišče', title: 'Najem strelne linije', subtitle: 'Najem ene strelne linije', price: 43, unit: '/uro', sort_order: 20, is_active: true },
  { id: -3, section: 'Strelišče', title: 'Najem strelišča (8 linij)', subtitle: 'Najem vseh osmih strelnih linij', price: 149, unit: '/uro', sort_order: 30, is_active: true },
  { id: -4, section: 'Strelišče', title: 'Najem strelišča (8 linij)', subtitle: 'Najem vseh osmih strelnih linij za 4 ure', price: 447, unit: '/4h', sort_order: 40, is_active: true },
  { id: -5, section: 'Usposabljanja', title: 'Osnovno usposabljanje', subtitle: 'Usposabljanje za varno ravnanje z orožjem', price: 195, unit: '/osebo', sort_order: 110, is_active: true },
  { id: -6, section: 'Usposabljanja', title: 'Preizkus znanja', subtitle: 'Pisni in praktični preizkus', price: 50, unit: '/osebo', sort_order: 120, is_active: true },
  { id: -7, section: 'Usposabljanja', title: 'Individualne inštrukcije', subtitle: 'Ena ura z osebnim inštruktorjem', price: 65, unit: '/uro', sort_order: 130, is_active: true },
]

/** Objavljene postavke cenika iz Supabase, urejene po sort_order; rezerva ob napaki. */
export async function fetchPriceItems(): Promise<PriceItem[]> {
  try {
    const { data, error } = await supabase
      .from('price_items')
      .select('id,section,title,subtitle,price,unit,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (!error && data && data.length > 0) return data as PriceItem[]
  } catch { /* preskoči na rezervo */ }
  return FALLBACK_PRICE_ITEMS
}

/** Razvrsti postavke v razdelke; vrstni red razdelkov = po prvi postavki. */
export function groupBySection<T extends { section: string }>(items: T[]): { section: string; items: T[] }[] {
  const groups: { section: string; items: T[] }[] = []
  for (const it of items) {
    const g = groups.find(x => x.section === it.section)
    if (g) g.items.push(it)
    else groups.push({ section: it.section, items: [it] })
  }
  return groups
}

/** Cela števila brez decimalk (37), sicer dve decimalki (74,50). */
export function fmtAmount(p: number | null): string {
  if (p == null) return ''
  const whole = Number.isInteger(p)
  return p.toLocaleString('sl-SI', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })
}
