import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const PUBLIC_DATA_CACHE_TAG = "hotmap-public-data";
export const PUBLIC_DATA_REVALIDATE_SECONDS = 60;

/**
 * Membuat Supabase anon client tanpa cookie untuk query data publik read-only
 * agar aman dibungkus dengan Next.js `unstable_cache` lintas serverless instance.
 */
function createPublicAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Membungkus fetcher dataset publik (anon) ke dalam Next.js Data Cache persisten
 * (lintas cold-start / serverless instance di Vercel) dengan invalidasi tag instan.
 */
export function createCachedPublicFetcher(fetcher) {
  return unstable_cache(
    async () => {
      const publicClient = createPublicAnonClient();
      if (!publicClient) return null;
      return fetcher(publicClient);
    },
    ["hotmap-public-base-dataset-v1"],
    {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: [PUBLIC_DATA_CACHE_TAG],
    }
  );
}
