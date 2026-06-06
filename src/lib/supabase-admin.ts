import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

function normalizeEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const validUrl = /^https:\/\/[^/]+\.supabase\.co\/?$/i.test(url);
  const validKey =
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(serviceRoleKey) ||
    serviceRoleKey.startsWith("sb_secret_");

  if (!validUrl || !validKey) {
    client = null;
    return client;
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}
