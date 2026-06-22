// Einheitliche Daten-API. Waehlt je nach Konfiguration die echte
// Supabase-Implementierung oder den interaktiven Demo-Store.
import { isSupabaseConfigured } from '@/lib/supabase'
import { demoApi } from './demoStore'
import { supabaseApi } from './supabaseApi'

export const api = isSupabaseConfigured ? supabaseApi : demoApi

export * from './types'
