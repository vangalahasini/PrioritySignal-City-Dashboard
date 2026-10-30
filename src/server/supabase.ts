/**
 * PrioritySignal - Server-only Supabase Client
 * 
 * CRITICAL SECURITY CONSTRAINTS:
 * - Read only from server environment (SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY)
 * - Server-only execution; NEVER import into frontend / client components
 * - Never leak or log secret keys
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingEnv: string[];
  supabaseUrlProvided: boolean;
  supabaseSecretProvided: boolean;
  supabasePublishableProvided: boolean;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const missing: string[] = [];
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SECRET_KEY) missing.push('SUPABASE_SECRET_KEY');

  return {
    isConfigured: missing.length === 0,
    missingEnv: missing,
    supabaseUrlProvided: Boolean(process.env.SUPABASE_URL),
    supabaseSecretProvided: Boolean(process.env.SUPABASE_SECRET_KEY),
    supabasePublishableProvided: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY),
  };
}

let cachedAdminClient: SupabaseClient | null = null;
let cachedPublishableClient: SupabaseClient | null = null;

/**
 * Returns a server-only Supabase admin client using the service_role key
 * Returns null if required environment variables are missing
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    return null;
  }

  try {
    cachedAdminClient = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return cachedAdminClient;
  } catch (err) {
    console.error('[PrioritySignal Server] Failed to initialize Supabase admin client:', (err as Error).message);
    return null;
  }
}

/**
 * Returns a client using the public publishable anon key if available
 */
export function getSupabasePublishableClient(): SupabaseClient | null {
  if (cachedPublishableClient) {
    return cachedPublishableClient;
  }

  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  try {
    cachedPublishableClient = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return cachedPublishableClient;
  } catch (err) {
    console.error('[PrioritySignal Server] Failed to initialize Supabase publishable client:', (err as Error).message);
    return null;
  }
}
