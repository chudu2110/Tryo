import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string) || (process.env.SUPABASE_URL as string)
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (process.env.SUPABASE_KEY as string)

let client: any
if (url && key) {
  client = createClient(url, key, { db: { schema: 'public' } })
} else {
  const empty = { data: null, error: null }
  const fromApi = {
    select: async () => empty,
    insert: async () => empty,
    update: async () => empty,
    delete: async () => empty,
    eq() { return this },
    single: async () => empty,
    upsert: async () => empty
  }
  client = {
    from() { return fromApi },
    channel() { return { on() { return this }, subscribe: async () => {} } }
  }
}

export const supabase = client
