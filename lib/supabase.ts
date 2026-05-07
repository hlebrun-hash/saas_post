import { createClient } from "@supabase/supabase-js";

// Service role key — server-side only, jamais exposé au client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default supabase;
