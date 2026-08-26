import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

let envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '.env');
}
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val.join('=').trim().replace(/['"]/g, '');
  if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val.join('=').trim().replace(/['"]/g, '');
});

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Migrating expenses...");
  
  const { data: expenses, error: err1 } = await supabase.from('company_expenses').select('id');
  if (err1) console.error("Error fetching expenses", err1);
  else {
    for (const exp of expenses) {
      await supabase.from('company_expenses').update({ ledger_type: 'Global' }).eq('id', exp.id);
    }
    console.log(`Updated ${expenses.length} expenses.`);
  }

  console.log("Migrating income...");
  const { data: income, error: err2 } = await supabase.from('company_income').select('id');
  if (err2) console.error("Error fetching income", err2);
  else {
    for (const inc of income) {
      await supabase.from('company_income').update({ ledger_type: 'Global' }).eq('id', inc.id);
    }
    console.log(`Updated ${income.length} income records.`);
  }

  console.log("Done!");
}

migrate();
