import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const run=overrides=>spawnSync(process.execPath,['scripts/build-account.mjs'],{encoding:'utf8',env:{...process.env,SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:'',...overrides}});
test('production cannot replace the current site without account configuration',()=>{
  const result=run({VERCEL_ENV:'production'});assert.notEqual(result.status,0);assert.match(result.stderr,/Production requires/);
});
test('build refuses to publish a privileged service-role key',()=>{
  const payload=Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url');
  const result=run({SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:`header.${payload}.signature`});
  assert.notEqual(result.status,0);assert.match(result.stderr,/never a secret\/service-role key/);
});
