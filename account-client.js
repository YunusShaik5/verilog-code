import {createClient} from '@supabase/supabase-js';
export function createAccountClient(config) {
  if (!config.url || !config.publishableKey) return null;
  return createClient(config.url, config.publishableKey, {
    auth: {flowType:'pkce', persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}
  });
}
