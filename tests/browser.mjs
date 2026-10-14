// Real browser + Supabase SDK + SQL policies. OAuth transport is a local fixture;
// real Google consent must still be tested on the configured live deployment.
import {chromium} from 'playwright';
import {database} from './helpers/database.mjs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
const db=await database();
const root=path.resolve('public');
const server=http.createServer(async(req,res)=>{
  try{const filename=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));
    if(!filename.startsWith(root+'/')){res.writeHead(403).end();return;}
    const body=await fs.readFile(filename);const ext=path.extname(filename);
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm'})[ext]||'application/octet-stream');res.end(body);
  }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.SIGNAL_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
let sqlQueue=Promise.resolve();
const errors=[];
function session(id){
  const user={id,email:(id.endsWith('1')?'alice':'bob')+'@example.test',app_metadata:{provider:'google'},user_metadata:{},aud:'authenticated',created_at:new Date().toISOString()};
  const claims={sub:id,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600,app_metadata:{provider:'google'}};
  return {user,access_token:`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.local-test-fixture`,refresh_token:'fixture-refresh',token_type:'bearer',expires_at:claims.exp,expires_in:3600};
}
async function setup(context,id){
  await context.route('**/account-config.js',route=>route.fulfill({contentType:'text/javascript',body:"export const accountConfig={url:'https://signal-test.supabase.co',publishableKey:'sb_publishable_local_test_fixture'};"}));
  await context.addInitScript(s=>{if(!sessionStorage.getItem('fixture-seeded')){localStorage.setItem('sb-signal-test-auth-token',JSON.stringify(s));sessionStorage.setItem('fixture-seeded','1');}},session(id));
  await context.route('https://signal-test.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url()),cors={'access-control-allow-origin':origin,'access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'};
    if(req.method()==='OPTIONS'){await route.fulfill({status:200,headers:cors,body:''});return;}
    if(url.pathname==='/auth/v1/logout'){await route.fulfill({status:204,headers:cors});return;}
    const run=async()=>{
      try{
        const raw=req.headers().authorization?.replace('Bearer ',''),claims=JSON.parse(Buffer.from(raw.split('.')[1],'base64url'));
        assert.equal(claims.sub,id);assert(raw.endsWith('.local-test-fixture'));
        await db.exec('reset role');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify(claims)]);await db.exec('set role authenticated');
        let data;
        if(url.pathname.startsWith('/rest/v1/rpc/')){
          const fn=url.pathname.split('/').at(-1),body=req.postDataJSON();
          const argNames={signal_claim_username:['p_username'],signal_set_quota:['p_mebibytes'],signal_save_program:['p_id','p_name','p_design','p_testbench','p_language','p_time_limit','p_expected_version'],signal_delete_program:['p_id','p_expected_version']}[fn];
          assert(argNames);
          const result=await db.query(`select * from public.${fn}(${argNames.map((_,i)=>'$'+(i+1)).join(',')})`,argNames.map(k=>body[k]));data=result.rows;
        }else{
          const table=url.pathname.split('/').at(-1);assert(['signal_profiles','signal_programs'].includes(table));
          let query=`select * from public.${table}`,values=[];
          for(const key of ['user_id','id'])if(url.searchParams.has(key)){assert(url.searchParams.get(key).startsWith('eq.'));values.push(url.searchParams.get(key).slice(3));query+=`${values.length===1?' where':' and'} ${key}=$${values.length}`;}
          const result=await db.query(query,values);data=req.headers().accept?.includes('vnd.pgrst.object')?result.rows[0]||null:result.rows;
        }
        await route.fulfill({status:200,headers:cors,contentType:'application/json',body:JSON.stringify(data)});
      }catch(e){await route.fulfill({status:400,headers:cors,contentType:'application/json',body:JSON.stringify({message:e.message,code:e.code||'TEST_ERROR'})});}
    };
    sqlQueue=sqlQueue.then(run,run);await sqlQueue;
  });
}
try{
  const signedOut=await browser.newPage();signedOut.on('pageerror',e=>errors.push(e.message));await signedOut.goto(origin);
  await signedOut.getByText('Google sign-in is not configured yet.',{exact:false}).waitFor();assert(await signedOut.locator('main').isHidden());
  await signedOut.screenshot({path:'test-results/signin-desktop.png'});await signedOut.close();
  const a=await browser.newContext({viewport:{width:1440,height:1000}});await setup(a,'00000000-0000-4000-8000-000000000001');
  const page=await a.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);
  await page.locator('#username').fill('Alice_lab');await page.locator('#username-submit').click();await page.locator('main').waitFor({state:'visible'});
  await page.locator('#new-file-button').click();await page.locator('#file-name').fill('private-test.v');await page.locator('#file-form-submit').click();await page.locator('#file-form-dialog').waitFor({state:'hidden'});
  const source='module main(input a,b,output y);\nassign y=a^b;\nendmodule\n// Alice private source';
  await page.locator('#code-editor').fill(source);await page.locator('#save-file-button').click();await page.getByText('Saved privately to your account',{exact:true}).waitFor();
  await page.locator('#run-button').click();await page.waitForFunction(()=>document.querySelector('#simulation-status').textContent.startsWith('Complete'),{},{timeout:60000});
  await page.locator('#play-button').click();await page.waitForFunction(()=>document.querySelector('#current-time').textContent!=='0 ns');await page.locator('#play-button').click();
  assert(await page.locator('#wave-content svg').count());assert(await page.locator('#diagram-content svg').count());
  await page.screenshot({path:'test-results/workspace-desktop.png'});
  await page.reload();await page.locator('main').waitFor({state:'visible'});await page.locator('#my-files-button').click();await page.locator('.program-row button').filter({hasText:'Open'}).click();await page.locator('#files-dialog').waitFor({state:'hidden'});assert.equal(await page.locator('#code-editor').inputValue(),source);
  await page.locator('#my-files-button').click();await page.locator('.program-row button').filter({hasText:'Rename'}).click();await page.locator('#file-name').fill('renamed.v');await page.locator('#file-form-submit').click();await page.locator('#file-form-dialog').waitFor({state:'hidden'});await page.getByText('renamed.v',{exact:true}).last().waitFor();
  await page.locator('#storage-quota').selectOption('7');await page.locator('#storage-save').click();await page.waitForFunction(()=>document.querySelector('#storage-label').textContent.includes('7.00 MiB'));
  await page.screenshot({path:'test-results/private-files.png'});
  await page.locator('#files-dialog .close-dialog').click();await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('#sidebar').getBoundingClientRect().right<=0);await page.screenshot({path:'test-results/workspace-mobile.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.setViewportSize({width:1440,height:1000});await page.locator('#signout-button').click();await page.locator('#account-gate').waitFor({state:'visible'});
  assert(!(await page.locator('#code-editor').inputValue()).includes('Alice private'));assert.equal(await page.locator('#program-list').textContent(),'');assert.equal(await page.locator('#wave-content svg').count(),0);
  const b=await browser.newContext();await setup(b,'00000000-0000-4000-8000-000000000002');const other=await b.newPage();other.on('pageerror',e=>errors.push(e.message));await other.goto(origin);
  await other.locator('#username').fill('ALICE_LAB');await other.locator('#username-submit').click();await other.getByText('Username already taken',{exact:true}).waitFor();
  await other.locator('#username').fill('bob_lab');await other.locator('#username-submit').click();await other.locator('main').waitFor({state:'visible'});await other.locator('#my-files-button').click();assert(!(await other.locator('#program-list').textContent()).includes('renamed.v'));
  assert.deepEqual(errors,[]);console.log('PASS browser: built sign-in gate, real SDK session, SQL username conflict, create/save/reload/open/rename, quota, actual WASM waveform/diagram/playback, mobile layout, signout, second-account privacy. OAuth transport simulated.');
}finally{await browser.close();await db.close();await new Promise(r=>server.close(r));}
