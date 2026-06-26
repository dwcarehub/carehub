// ===================================================
// Supabase Client
// ===================================================

const supabase = window.supabase.createClient(
    AppConfig.SUPABASE_URL,
    AppConfig.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);