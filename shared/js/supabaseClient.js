(function () {
  let client = null;

  function getClient() {
    if (client) return client;

    if (!window.supabase) {
      throw new Error("Supabase library is not loaded.");
    }

    const config = window.APP_CONFIG;
    if (!config?.supabaseUrl || !config?.supabasePublishableKey) {
      throw new Error("Supabase public configuration is missing.");
    }

    client = window.supabase.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    return client;
  }

  window.AppSupabase = Object.freeze({ getClient });
})();
