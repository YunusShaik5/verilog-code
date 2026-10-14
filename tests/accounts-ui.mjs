import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Window} from 'happy-dom';
const window=new Window({url:'https://signal.test/',settings:{disableJavaScriptFileLoading:true,disableJavaScriptEvaluation:true,disableCSSFileLoading:true}});
const doc=window.document;doc.write(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'));
const $=s=>doc.querySelector(s),tick=()=>new Promise(r=>setTimeout(r,20));
const users={alice:{id:'alice',email:'alice@example.test',app_metadata:{provider:'google'}},bob:{id:'bob',email:'bob@example.test',app_metadata:{provider:'google'}}};
let session=null,authChanged,rows=[],profiles={},code={design:'public example',testbench:'',language:'2012',limit:'1000'},notice='',names=[],deferSave;
const client={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:fn=>{authChanged=fn;},signOut:async()=>{session=null;authChanged('SIGNED_OUT',null);return{};},signInWithOAuth:async options=>{assert.equal(options.provider,'google');return{};}},
  from(table){let filters=[],single=false;const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},order(){return q;},maybeSingle(){single=true;return q;},single(){single=true;return q;},then(resolve){const all=table==='signal_profiles'?Object.values(profiles):rows;const result=all.filter(r=>r.user_id===session?.user.id&&filters.every(([k,v])=>r[k]===v));return Promise.resolve({data:structuredClone(single?result[0]||null:result)}).then(resolve);}};return q;},
  async rpc(name,p){
    const id=session?.user.id;
    if(name==='signal_claim_username'){const username=p.p_username.toLowerCase();if(Object.values(profiles).some(x=>x.username===username))return{error:{message:'Username already taken'}};profiles[id]={user_id:id,username,quota_bytes:5242880};return{data:profiles[id]};}
    if(name==='signal_set_quota'){profiles[id].quota_bytes=p.p_mebibytes*1048576;return{data:profiles[id]};}
    if(name==='signal_delete_program'){rows=rows.filter(r=>r.id!==p.p_id);return{};}
    if(name==='signal_save_program'){
      if(deferSave)await deferSave;
      const prior=rows.find(r=>r.id===p.p_id);if(rows.some(r=>r.user_id===id&&r.name===p.p_name&&r.id!==p.p_id))return{error:{message:'You already have a file with that name'}};
      const row={id:p.p_id||crypto.randomUUID(),user_id:id,name:p.p_name,design:p.p_design,testbench:p.p_testbench,language:p.p_language,time_limit:p.p_time_limit,version:(prior?.version||0)+1,size_bytes:p.p_design.length+p.p_testbench.length,updated_at:new Date().toISOString()};rows=rows.filter(r=>r.id!==row.id);rows.push(row);return{data:structuredClone(row)};
    }
    throw new Error(name);
  }};
window.happyDOM.settings.disableJavaScriptEvaluation=false;
window.createAccountClient=()=>client;window.accountConfig={};
window.eval(fs.readFileSync(new URL('../accounts.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function initAccounts','function initAccounts')+'\nwindow.initAccounts=initAccounts;');
const accounts=window.initAccounts({toast:t=>notice=t,confirm:(_t,_m,fn)=>fn(),reset:()=>{code={design:'public example',testbench:'',language:'2012',limit:'1000'};},snapshot:()=>({...code}),name:n=>names.push(n),ready(){},load:f=>{code={design:f.design,testbench:f.testbench,language:f.language,limit:String(f.time_limit)};}},{client,document:doc});
await tick();assert(!$('#account-gate').hidden);assert($('main').hidden);
async function login(name){session={user:users[name]};authChanged('SIGNED_IN',session);await tick();}
async function username(name){$('#username').value=name;await $('#username-form').onsubmit({preventDefault(){}});}
await login('alice');assert(!$('#username-form').hidden);await username('Alice_lab');assert($('#account-gate').hidden);assert(accounts.ready());
$('#new-file-button').click();await tick();assert($('#file-form-dialog').open);$('#file-name').value='my_mux.v';await $('#file-form').onsubmit({preventDefault(){}});
assert.equal(rows.length,1);assert.equal(names.at(-1),'my_mux.v');assert(code.design.includes('module main'));
code.design='alice PRIVATE PROGRAM';accounts.onEdit();await accounts.save();assert.equal(rows[0].design,code.design);assert.equal($('#save-status').textContent,'Saved privately to your account');
await $('#my-files-button').onclick();assert($('#program-list').textContent.includes('my_mux.v'));
$('#storage-quota').value='8';await $('#storage-save').onclick();assert.equal(profiles.alice.quota_bytes,8388608);
const buttons=[...$('#program-list').querySelectorAll('button')];buttons.find(b=>b.textContent==='Rename').click();$('#file-name').value='renamed.v';await $('#file-form').onsubmit({preventDefault(){}});assert.equal(rows[0].name,'renamed.v');
// An old autosave must not attach a newly loaded example to the previous file.
let release;deferSave=new Promise(r=>release=r);code.design='last edit';accounts.onEdit();const pending=accounts.save();await tick();accounts.detach();code.design='new public example';release();await pending;deferSave=null;assert.equal(names.at(-1),null);assert.equal(rows[0].design,'last edit');
await $('#signout-button').onclick();await tick();assert(!accounts.ready());assert($('main').hidden);assert(!$('#program-list').textContent.includes('renamed'));assert(!code.design.includes('PRIVATE'));
await login('bob');await username('ALICE_LAB');assert($('#account-message').textContent.includes('taken'));assert(!$('main').hidden===false);
await username('bob_lab');await $('#my-files-button').onclick();assert(!$('#program-list').textContent.includes('renamed'));assert($('#program-list').textContent.includes('No saved files'));
await $('#signout-button').onclick();await tick();await login('alice');await $('#my-files-button').onclick();$('#program-list button').click();await tick();assert.equal(code.design,'last edit');
assert.equal(window.localStorage.getItem('signal.workspace.v1'),null);
console.log('PASS account UI: sign-in gate, username registration/conflict, create/save/rename/open, quotas, account switch, logout clearing, late-save isolation.');
await window.happyDOM.close();
