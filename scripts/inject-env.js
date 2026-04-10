const fs = require('fs');
const path = require('path');

const root = process.cwd();
const envFile = path.join(root, 'assets', 'js', 'env.js');

const supabaseUrl = process.env.SUPABASE_URL || 'REPLACE_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'REPLACE_SUPABASE_ANON_KEY';

if (!fs.existsSync(envFile)) {
  throw new Error(`env.js not found at ${envFile}`);
}

let content = fs.readFileSync(envFile, 'utf8');
content = content
  .replace(/REPLACE_SUPABASE_URL/g, supabaseUrl)
  .replace(/REPLACE_SUPABASE_ANON_KEY/g, supabaseAnonKey);

fs.writeFileSync(envFile, content, 'utf8');
console.log('Injected SUPABASE_URL and SUPABASE_ANON_KEY into assets/js/env.js');
