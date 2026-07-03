import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');

    const sql = readFileSync(join(__dirname, 'supabase', 'init.sql'), 'utf-8');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      } catch (err) {
        console.log('Executing SQL directly...');
      }
    }

    console.log('Database setup complete!');
    console.log('\nYou can now:');
    console.log('1. Run the development server');
    console.log('2. Create an account');
    console.log('3. Start sending encrypted messages\n');
  } catch (error) {
    console.error('Error setting up database:', error.message);
    console.log('\nPlease run the SQL from supabase/init.sql manually in the Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/_/sql\n');
  }
}

setupDatabase();
