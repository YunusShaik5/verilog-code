import {test} from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/database.mjs';

const alice='00000000-0000-4000-8000-000000000001',bob='00000000-0000-4000-8000-000000000002';
async function login(db,id,provider='google'){
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,app_metadata:{provider}})]);
  await db.exec(id?'set role authenticated':'set role anon');
}
const save=(db,id,name,design='module x; endmodule',version=null)=>db.query('select * from public.signal_save_program($1,$2,$3,$4,$5,$6,$7)',[id,name,design,'','2012',1000,version]);
test('real PostgreSQL: ownership, quotas, usernames, conflict checks, and anonymous denial',async()=>{
  const db=await database();
  try{
    await login(db,null);
    await assert.rejects(()=>db.query('select * from public.signal_programs'),/permission denied/);
    await assert.rejects(()=>db.query("select public.signal_claim_username('visitor')"),/permission denied/);
    await login(db,alice,'email');
    await assert.rejects(()=>db.query("select public.signal_claim_username('alice')"),/Google sign-in required/);
    await login(db,alice);
    await db.query("select public.signal_claim_username('Alice_lab')");
    assert.equal((await db.query('select username from public.signal_profiles')).rows[0].username,'alice_lab');
    await assert.rejects(()=>db.query("update public.signal_profiles set quota_bytes=99999999"),/permission denied/);
    const a=(await save(db,null,'secret.v','my private code')).rows[0];
    assert.equal(a.size_bytes,15);
    await assert.rejects(()=>save(db,null,'SECRET.V'),/already have a file/);
    await login(db,bob);
    await assert.rejects(()=>db.query("select public.signal_claim_username('ALICE_LAB')"),/Username already taken/);
    await db.query("select public.signal_claim_username('bob_lab')");
    assert.equal((await db.query('select * from public.signal_programs')).rows.length,0);
    assert.equal((await db.query('select * from public.signal_profiles')).rows.length,1);
    await assert.rejects(()=>save(db,a.id,'hacked.v','hacked',1),/File not found/);
    await assert.rejects(()=>db.query('select public.signal_delete_program($1,1)',[a.id]),/File not found/);
    await assert.rejects(()=>db.query('insert into public.signal_programs(user_id,name) values($1,$2)',[alice,'spoof.v']),/permission denied/);
    await save(db,null,'secret.v'); // Same filename in another account is allowed.
    await login(db,alice);
    assert.equal((await db.query('select design from public.signal_programs')).rows[0].design,'my private code');
    const updated=(await save(db,a.id,'renamed.v','updated',1)).rows[0];
    assert.equal(updated.version,2);
    await assert.rejects(()=>save(db,a.id,'renamed.v','lost edit',1),/another tab/);
    await assert.rejects(()=>db.query('select public.signal_delete_program($1,1)',[a.id]),/another tab/);
    await db.query('select public.signal_set_quota(1)');
    await assert.rejects(()=>db.query('select public.signal_set_quota(11)'),/Choose 1-10 MiB/);
    await assert.rejects(()=>save(db,null,'huge.v','a'.repeat(1048577)),/at most 1 MiB/);
    await save(db,null,'large.v','a'.repeat(1048560));
    await assert.rejects(()=>save(db,null,'overflow.v'),/Storage limit reached/);
    await db.query('select public.signal_set_quota(2)');
    await save(db,null,'unicode.v','😀'.repeat(20));
    await assert.rejects(()=>db.query('select public.signal_set_quota(1)'),/Delete files/);
    await db.query('select public.signal_delete_program($1,2)',[a.id]);
    assert.equal((await db.query('select * from public.signal_programs where id=$1',[a.id])).rows.length,0);
    await login(db,alice,'email');
    assert.equal((await db.query('select * from public.signal_programs')).rows.length,0);
    await assert.rejects(()=>db.query('select public.signal_set_quota(2)'),/Google sign-in required/);
  }finally{await db.close();}
});
