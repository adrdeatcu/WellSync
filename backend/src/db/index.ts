import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment variables');
}

// This client has full access and bypasses RLS; use ONLY on the server.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function testDbConnection() {
  const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
  if (error) {
    console.error('Supabase admin test query failed:', error);
    throw error;
  }
  console.log('Supabase admin connection OK');
}