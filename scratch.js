import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const code = fs.readFileSync('src/supabase.js', 'utf8');
const urlMatch = code.match(/supabaseUrl = ['\"]([^'\"]+)['\"]/);
const keyMatch = code.match(/supabaseAnonKey = ['\"]([^'\"]+)['\"]/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
supabase.from('profiles').select('*').limit(1).then(res => console.log(Object.keys(res.data[0] || {})));
