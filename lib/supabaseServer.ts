import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Service role key — bypasses RLS. Only used server-side via Server Actions / Route Handlers.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}
