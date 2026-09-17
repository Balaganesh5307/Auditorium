import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve(process.cwd(), '.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.replace('VITE_SUPABASE_URL=', '').trim();
    }
    if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = trimmed.replace('SUPABASE_SERVICE_ROLE_KEY=', '').trim();
    } else if (!supabaseKey && trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = trimmed.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
    }
  }
}

console.log('--- Supabase Connection Check ---');
console.log('Target URL:', supabaseUrl);
console.log('Using Key:', supabaseKey ? supabaseKey.slice(0, 16) + '...' : 'NONE');

if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
  console.error('\n❌ Error: Please set your VITE_SUPABASE_URL in .env before running this script.');
  console.log('Find your Project URL in Supabase Dashboard -> Project Settings -> API.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAndSeed() {
  try {
    console.log('\nTesting connection to Supabase...');
    const { data, error } = await supabase.from('teams').select('table_id').limit(5);

    if (error) {
      console.error('❌ Supabase Query Error:', error.message);
      if (error.message.includes('relation "public.teams" does not exist')) {
        console.log('\n💡 You need to create the table first in Supabase SQL Editor:');
        console.log(`
create table if not exists teams (
  table_id text primary key,
  team_name text not null,
  position text not null,
  members jsonb not null default '[]'::jsonb,
  project_description text default '',
  updated_at timestamptz default now()
);
alter table teams enable row level security;
create policy "Public Access" on teams for all using (true) with check (true);
alter publication supabase_realtime add table teams;
        `);
      }
      return;
    }

    console.log('✅ Connection successful!');
    console.log(`Found ${data.length} sample rows in "teams" table.`);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testAndSeed();
