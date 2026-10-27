import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export async function createServerClient() {
  // Supabase auth reads the clock while loading the session; with Cache Components that must happen at request time.
  await connection();
  const cookieStore = await cookies();
  return createSsrServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read only. The proxy refreshes the session.
        }
      },
    },
  });
}
