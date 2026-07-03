import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL() {
  console.log('Reading SQL file...');
  const sql = readFileSync('./supabase/init.sql', 'utf-8');

  console.log('\n==============================================');
  console.log('IMPORTANT: Please run this SQL manually');
  console.log('==============================================\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/_/sql');
  console.log('2. Copy and paste the contents of supabase/init.sql');
  console.log('3. Click "Run" to execute the SQL\n');
  console.log('OR copy the SQL below:\n');
  console.log('----------------------------------------------');
  console.log(sql);
  console.log('----------------------------------------------\n');
}

runSQL();
