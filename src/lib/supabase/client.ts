import { createClient } from "@supabase/supabase-js";

let anonClient: ReturnType<typeof createClient> | null = null;
let serviceClient: ReturnType<typeof createClient> | null = null;

export function createSupabaseAnonClient() {
  if (anonClient) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase anon credentials not configured");
  anonClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}

export function createSupabaseServiceClient() {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials not configured");
  serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
