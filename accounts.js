import {createAccountClient} from './account-client.js';
import {accountConfig} from './account-config.js';

export function initAccounts(hooks, options={}) {
  const doc=options.document || document, $=s=>doc.querySelector(s);
  const client=options.client || createAccountClient(options.config || accountConfig);
  // PostgREST can encode a composite return as a one-row array.
  async function rpc(name, args){
    const result=await client.rpc(name,args);
    return {...result,data:Array.isArray(result.data)?result.data[0]:result.data};
  }
  let user=null, profile=null, files=[], active=null, epoch=0, dirty=false, timer;
  let workspace=0;
  let savePending=null, formMode='new', signingOut=false;
  const message=(text)=>{$('#account-message').textContent=text;};
  const fail=e=>{hooks.toast(e.message || 'Could not connect. Please try again.');};
  const bytes=n=>n>=1048576?`${(n/1048576).toFixed(2)} MiB`:`${(n/1024).toFixed(1)} KiB`;
  const assertCurrent=token=>{if(token!==epoch || !user)throw new Error('Account changed. Please try again.');};
  function lock(text='Sign in to your private workspace') {
    clearTimeout(timer);epoch++;workspace++;user=null;profile=null;files=[];active=null;dirty=false;savePending=null;
    hooks.reset();
    for(const dialog of doc.querySelectorAll('dialog[open]'))dialog.close();
    doc.querySelectorAll('main, #sidebar').forEach(el=>{el.inert=true;el.hidden=true;});
    $('#account-gate').hidden=false;$('#username-form').hidden=true;$('#google-signin').hidden=false;
    $('#account-retry').hidden=true;$('#gate-signout').hidden=true;$('#account-email').textContent='';
    $('#username').value='';$('#program-list').replaceChildren();$('#file-name').value='';$('#file-form-message').textContent='';
    message(text);$('#save-status').textContent='Sign in to save';
  }
  async function refresh(token=epoch) {
    const [p,f]=await Promise.all([
      client.from('signal_profiles').select('*').eq('user_id',user.id).maybeSingle(),
      client.from('signal_programs').select('id,name,size_bytes,version,updated_at').order('updated_at',{ascending:false})
    ]);
    assertCurrent(token);if(p.error)throw p.error;if(f.error)throw f.error;
    profile=p.data;files=f.data || [];renderFiles();
  }
  function renderFiles() {
    const list=$('#program-list');list.replaceChildren();
    if(!files.length){const p=doc.createElement('p');p.className='muted-text';p.textContent='No saved files yet. Create your first program.';list.append(p);}
    for(const file of files){
      const row=doc.createElement('article');row.className='program-row';
      const info=doc.createElement('div'),title=doc.createElement('strong'),detail=doc.createElement('small');
      title.textContent=file.name;detail.textContent=`${bytes(file.size_bytes)} · ${new Date(file.updated_at).toLocaleString()}`;
      info.append(title,detail);row.append(info);
      for(const [label,action] of [['Open',()=>open(file)],['Rename',()=>showForm('rename',file)],['Delete',()=>remove(file)]]){
        const b=doc.createElement('button');b.className='button quiet';b.textContent=label;b.onclick=action;row.append(b);
      }list.append(row);
    }
    const used=files.reduce((sum,f)=>sum+f.size_bytes,0),quota=profile?.quota_bytes || 5242880;
    $('#storage-meter').max=quota;$('#storage-meter').value=used;
    $('#storage-label').textContent=`${bytes(used)} of ${bytes(quota)} used · ${files.length}/100 files`;
    $('#storage-quota').value=String(quota/1048576);
    $('#account-name').textContent=profile?'@'+profile.username:'';
  }
  function unlock(){
    $('#account-gate').hidden=true;
    doc.querySelectorAll('main, #sidebar').forEach(el=>{el.inert=false;el.hidden=false;});
    $('#save-status').textContent='New draft · Save as to keep it';
    hooks.ready();
  }
  async function acceptSession(session){
    if(signingOut)return;
    if(session?.user?.id===user?.id)return;
    lock();
    if(!session?.user)return;
    user=session.user;const token=epoch;
    $('#google-signin').hidden=true;$('#gate-signout').hidden=false;
    $('#account-email').textContent=user.email || '';
    try{
      if(user.app_metadata?.provider!=='google')throw new Error('Use a Google account to sign in.');
      message('Opening your workspace…');await refresh(token);assertCurrent(token);
      if(!profile){$('#username-form').hidden=false;message('Choose your unique username');$('#username').focus();}
      else unlock();
    }catch(e){if(token!==epoch)return;message(e.message || 'Could not load your account.');$('#account-retry').hidden=false;}
  }
  async function save(asNew=false,name){
    if(!user||!profile)throw new Error('Sign in and choose a username first.');
    if(!active&&!asNew){showForm('save');return;}
    if(savePending){await savePending;return save(asNew,name);}
    const token=epoch, editWorkspace=workspace, snapshot=hooks.snapshot(), target=asNew?null:active;
    $('#save-status').textContent='Saving to your account…';
    const task=(async()=>{
      const {data,error}=await rpc('signal_save_program',{
        p_id:target?.id || null,p_name:name || target?.name,p_design:snapshot.design,p_testbench:snapshot.testbench,
        p_language:snapshot.language,p_time_limit:Number(snapshot.limit),p_expected_version:target?.version || null
      });
      assertCurrent(token);if(error)throw error;
      if(editWorkspace!==workspace){await refresh(token);return data;}
      active=data;dirty=JSON.stringify(snapshot)!==JSON.stringify(hooks.snapshot());hooks.name(active.name);
      $('#save-status').textContent=dirty?'Unsaved changes':'Saved privately to your account';
      await refresh(token);
      if(dirty)schedule();
      return data;
    })();
    savePending=task;
    try{return await task;}catch(e){if(token===epoch){dirty=true;$('#save-status').textContent='Not saved · retry Save or export';}throw e;}
    finally{if(savePending===task)savePending=null;}
  }
  function schedule(){clearTimeout(timer);if(active)timer=setTimeout(()=>save().catch(fail),900);}
  function onEdit(){if(!user||!profile)return;
    const draft=hooks.snapshot();
    dirty=!active || draft.design!==active.design || draft.testbench!==active.testbench || draft.language!==active.language || Number(draft.limit)!==active.time_limit;
    if(!dirty){clearTimeout(timer);$('#save-status').textContent='Saved privately to your account';return;}
    $('#save-status').textContent=active?'Unsaved changes':'New draft · Save as to keep it';schedule();}
  async function leave(action){
    if(!dirty){await action();return;}
    hooks.confirm('Leave unsaved changes?','Use Save or Export first to keep your edits. Continue without saving?',()=>{clearTimeout(timer);Promise.resolve(action()).catch(fail);});
  }
  async function open(file){
    await leave(async()=>{
      if(savePending)await savePending;
      const token=epoch;const {data,error}=await client.from('signal_programs').select('*').eq('id',file.id).single();
      assertCurrent(token);if(error)throw error;
      clearTimeout(timer);active=data;dirty=false;hooks.load(data);hooks.name(data.name);
      $('#save-status').textContent='Saved privately to your account';$('#files-dialog').close();
    }).catch(fail);
  }
  let renameTarget=null;
  function showForm(mode,file){
    formMode=mode;renameTarget=file || null;
    $('#file-form-title').textContent=mode==='new'?'Create a new file':mode==='rename'?'Rename file':'Save as a new file';
    $('#file-name').value=mode==='rename'?file.name:'';$('#file-form-message').textContent='';
    $('#file-form-dialog').showModal();$('#file-name').focus();
  }
  async function remove(file){
    hooks.confirm('Delete this file?',`Delete “${file.name}” from your account? Download a copy first if you want to keep it.`,async()=>{
      const token=epoch;
      try{
        if(savePending)await savePending;
        const current=files.find(f=>f.id===file.id) || file;
        const {error}=await rpc('signal_delete_program',{p_id:current.id,p_expected_version:current.version});
        assertCurrent(token);if(error)throw error;
        if(active?.id===file.id){clearTimeout(timer);active=null;dirty=false;hooks.reset();$('#save-status').textContent='New draft · Save as to keep it';}
        await refresh(token);hooks.toast('File deleted');
      }catch(e){if(token===epoch)fail(e);}
    });
  }
  $('#file-form').onsubmit=async e=>{
    e.preventDefault();const name=$('#file-name').value.trim(),token=epoch,button=$('#file-form-submit');button.disabled=true;
    try{
      if(formMode==='new'){
        // Creation is confirmed before opening this form, so no existing draft is silently lost.
        if(savePending)await savePending;
        const {data,error}=await rpc('signal_save_program',{p_id:null,p_name:name,p_design:'module main(input a, b, output y);\n  assign y = a & b;\nendmodule\n',p_testbench:'`timescale 1ns/1ps\nmodule tb;\n  reg a=0,b=0;\n  wire y;\n  main dut(a,b,y);\n  initial begin\n    #10 b=1;\n    #10 a=1;\n    #10 b=0;\n    #10 $finish;\n  end\nendmodule\n',p_language:'2012',p_time_limit:1000,p_expected_version:null});
        assertCurrent(token);if(error)throw error;clearTimeout(timer);active=data;dirty=false;hooks.load(data);hooks.name(data.name);$('#save-status').textContent='Saved privately to your account';await refresh(token);
      }else if(formMode==='rename'){
        if(savePending)await savePending;
        if(active?.id===renameTarget.id)await save(false,name);
        else {
          const {data,error}=await client.from('signal_programs').select('*').eq('id',renameTarget.id).single();
          assertCurrent(token);if(error)throw error;
          const result=await rpc('signal_save_program',{p_id:data.id,p_name:name,p_design:data.design,p_testbench:data.testbench,p_language:data.language,p_time_limit:data.time_limit,p_expected_version:data.version});
          assertCurrent(token);if(result.error)throw result.error;await refresh(token);
        }
      }else await save(true,name);
      if(token!==epoch)return;
      $('#file-form-dialog').close();hooks.toast(formMode==='rename'?'File renamed':'File saved privately');
    }catch(e){if(token===epoch)$('#file-form-message').textContent=e.message || 'Could not save.';}
    finally{button.disabled=false;}
  };
  $('#new-file-button').onclick=()=>leave(()=>showForm('new')).catch(fail);
  $('#save-file-button').onclick=()=>save().catch(fail);
  $('#save-as-button').onclick=()=>showForm('save');
  $('#my-files-button').onclick=async()=>{try{await refresh();$('#files-dialog').showModal();}catch(e){fail(e);}};
  $('#storage-save').onclick=async()=>{
    const token=epoch;try{const {error}=await rpc('signal_set_quota',{p_mebibytes:Number($('#storage-quota').value)});assertCurrent(token);if(error)throw error;await refresh(token);hooks.toast('Storage limit updated');}catch(e){fail(e);}
  };
  $('#google-signin').onclick=async()=>{
    if(!client)return;
    $('#google-signin').disabled=true;message('Opening Google sign-in…');
    try{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/',queryParams:{prompt:'select_account'}}});if(error)throw error;}
    catch(e){message(e.message || 'Sign-in failed. Try again.');$('#google-signin').disabled=false;}
  };
  $('#username-form').onsubmit=async e=>{
    e.preventDefault();const token=epoch;$('#username-submit').disabled=true;
    try{const {data,error}=await rpc('signal_claim_username',{p_username:$('#username').value});assertCurrent(token);if(error)throw error;profile=data;renderFiles();unlock();}
    catch(e){if(token===epoch)message(e.message || 'Could not create username.');}
    finally{$('#username-submit').disabled=false;}
  };
  async function signOut(){
    signingOut=true;lock('Signing out…');
    try{const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;message('Sign in to your private workspace');}
    catch(e){message('Sign-out could not finish. Retry before leaving this device.');$('#gate-signout').hidden=false;$('#google-signin').hidden=true;}
    finally{signingOut=false;}
  }
  $('#signout-button').onclick=()=>leave(signOut).catch(fail);$('#gate-signout').onclick=signOut;
  $('#account-retry').onclick=async()=>{user=null;const {data,error}=await client.auth.getSession();if(error)message(error.message);else await acceptSession(data.session);};
  doc.defaultView.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  // Clear private editor/results from back-forward cache, then validate on restore.
  doc.defaultView.addEventListener('pagehide',()=>lock());
  doc.defaultView.addEventListener('pageshow',e=>{if(e.persisted&&client)$('#account-retry').click();});
  lock();
  if(!client){message('Google sign-in is not configured yet. The site owner needs to connect account storage.');$('#google-signin').disabled=true;}
  else{
    client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>acceptSession(session),0);});
    client.auth.getSession().then(({data,error})=>{if(error)message(error.message);else acceptSession(data.session);}).catch(e=>message(e.message));
  }
  return {onEdit,save,ready:()=>!!user&&!!profile,isDirty:()=>dirty,detach(){workspace++;clearTimeout(timer);active=null;dirty=false;hooks.name(null);},refresh};
}
