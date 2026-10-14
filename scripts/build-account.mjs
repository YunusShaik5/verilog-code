import fs from 'node:fs';
import {build} from 'esbuild';
const url = process.env.SUPABASE_URL || '';
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
if (process.env.VERCEL_ENV === 'production' && (!url || !publishableKey)) {
  throw new Error('Production requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. Complete ACCOUNT_SETUP.md before publishing.');
}
if (!!url !== !!publishableKey) throw new Error('Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
if (url && new URL(url).protocol !== 'https:') throw new Error('Supabase requires HTTPS.');
if (publishableKey && !publishableKey.startsWith('sb_publishable_')) {
  let role;
  try { role = JSON.parse(Buffer.from(publishableKey.split('.')[1], 'base64url')).role; } catch {}
  if (role !== 'anon') throw new Error('Use a publishable or legacy anon key, never a secret/service-role key.');
}
fs.mkdirSync('public', {recursive:true});
fs.writeFileSync('public/account-config.js', `export const accountConfig = ${JSON.stringify({url,publishableKey})};\n`);
await build({entryPoints:['account-client.js'],bundle:true,format:'esm',platform:'browser',outfile:'public/account-client.js',minify:true,legalComments:'eof'});
console.log(url ? 'Google account integration configured.' : 'Account configuration absent: site will display a setup-required sign-in screen.');
