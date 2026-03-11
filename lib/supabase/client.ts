import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { getSupabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient<Database> | null = null;

export function createClient() {
  if (!browserClient) {
    const { supabaseUrl, supabaseKey } = getSupabaseEnv();

    if (!supabaseUrl || !supabaseKey) {
      // During SSR prerendering at build time, env vars are not available.
      // Return a placeholder client — it is never used for actual API calls
      // because all Supabase calls in client components run inside useEffect,
      // which only executes in the browser.
      return createBrowserClient<Database>(
        "http://placeholder.invalid",
        "placeholder",
      );
    }

    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  }

  return browserClient;
}
