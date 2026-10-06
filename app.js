import {examples} from './examples.js';
import {escapeHTML as esc,parseVCD,valueAt,formatValue,timeLabel,topModule,createTestbench,cleanSource} from './core.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const editor=$('#code-editor');
const state={design:examples.full.design,testbench:examples.full.testbench,example:'full',file:'design',modified:false,stale:false,data:null,vcd:'',netlist:null,netlistSource:'',cursor:0,base:'bin',selected:new Set(),playing:false,loop:false,busy:false,workers:new Set(),generation:0,zoom:1,panX:0,panY:0,wireValues:[],lastFrame:0,animation:null,log:[],waveWidth:900};
let saveTimer,toastTimer,confirmAction=null;

function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3600);}
function save(){try{localStorage.setItem('signal.workspace.v1',JSON.stringify({design:state.design,testbench:state.testbench,example:state.example,modified:state.modified,limit:$('#time-limit').value,language:$('#language').value}));$('#save-status').innerHTML='<span class="online-dot"></span>Saved on this device';}catch{$('#save-status').textContent='Export to save your code';}}
function updateProject(){
  const ex=examples[state.example];
  $('#project-name').textContent=state.modified?'My circuit':ex?.name||'My circuit';
  $('#project-tag').textContent=state.modified?'CUSTOM':'EXAMPLE';
  if(state.netlist&&!state.modified){const mod=topModule(state.netlist)?.[1];if(mod){const p=Object.values(mod.ports);$('#project-meta').textContent=`${p.filter(x=>x.direction==='input').length} inputs · ${p.filter(x=>x.direction==='output').length} outputs · ${Object.keys(mod.cells).length} logic cells`;}}
  else $('#project-meta').textContent=state.modified?'Edit your design, then run to update the results.':'Ready-to-run design and testbench';
  $('#insight-text').textContent=state.modified?'The testbench controls your inputs over time. Run again after editing, then use the timeline to inspect the new results.':ex?.explanation||'';
  $$('[data-example]').forEach(b=>b.classList.toggle('active',b.dataset.example===state.example&&!state.modified));
  $('#design-dirty').hidden=!state.modified;
}
function markStale(){
  if(state.busy)stopRun(false);
  pause();state.modified=true;state.stale=true;updateProject();
  $('#simulation-status').textContent='Code changed · run to update';$('#simulation-status').className='status-text';
  $('#diagram-time').textContent=state.data?'PREVIOUS RUN':'AWAITING SIMULATION';
  $('#save-status').textContent='Saving…';clearTimeout(saveTimer);saveTimer=setTimeout(save,400);
}
function highlight(text){
  const pattern=/(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|\b(?:module|endmodule|input|output|inout|wire|reg|logic|integer|parameter|localparam|assign|always|always_comb|always_ff|initial|begin|end|if|else|case|endcase|default|for|while|repeat|forever|posedge|negedge|or|not|and|nand|nor|xor|xnor|generate|endgenerate|genvar|function|endfunction|task|endtask)\b|\$\w+|`\w+|\b\d+'[sS]?[bBoOdDhH][\da-fA-F_xXzZ?]+|\b\d+(?:\.\d+)?\b|[&|^~!+*<>=?:]+)/g;
  let html='',last=0;
  for(const m of text.matchAll(pattern)){
    html+=esc(text.slice(last,m.index));const token=m[0];
    const kind=token.startsWith('//')||token.startsWith('/*')?'comment':token[0]==='"'?'string':/^[\d]/.test(token)?'number':/^[`$]/.test(token)?'system':/^[&|^~!+*<>=?:]/.test(token)?'operator':'keyword';
    html+=`<span class="tok-${kind}">${esc(token)}</span>`;last=m.index+token.length;
  }
  return html+esc(text.slice(last))+'\n';
}
function renderEditor(){
  $('#highlighted-code').innerHTML=highlight(editor.value);
  $('#line-numbers').textContent=Array.from({length:editor.value.split('\n').length},(_,i)=>i+1).join('\n');syncScroll();cursorPosition();
}
function syncScroll(){$('#highlighted-code').style.transform=`translate(${-editor.scrollLeft}px,${-editor.scrollTop}px)`;$('#line-numbers').scrollTop=editor.scrollTop;}
function cursorPosition(){const parts=editor.value.slice(0,editor.selectionStart).split('\n');$('#line-position').textContent=`Ln ${parts.length}, Col ${parts.at(-1).length+1}`;}
function switchFile(file){
  state.file=file;editor.value=state[file];editor.scrollTop=0;editor.scrollLeft=0;
  $$('[data-file]').forEach(b=>{const on=b.dataset.file===file;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
  $('#editor-caption').textContent=file==='design'?'Describe your circuit':'Define how inputs change over time';
  editor.setAttribute('aria-label',file==='design'?'Verilog design code':'Verilog testbench code');renderEditor();
}
editor.addEventListener('input',()=>{state[state.file]=editor.value;renderEditor();markStale();});
editor.addEventListener('scroll',syncScroll);editor.addEventListener('click',cursorPosition);editor.addEventListener('keyup',cursorPosition);
editor.addEventListener('keydown',e=>{
  if(e.key==='Tab'){e.preventDefault();const start=editor.selectionStart;editor.setRangeText('  ',start,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}
});
$$('[data-file]').forEach(b=>b.onclick=()=>switchFile(b.dataset.file));

function confirmReplace(title,message,action){
  confirmAction=action;$('#confirm-title').textContent=title;$('#confirm-message').textContent=message;$('#confirm-dialog').showModal();
}
$('#confirm-accept').onclick=()=>{const fn=confirmAction;confirmAction=null;$('#confirm-dialog').close();fn?.();};
$('#confirm-cancel').onclick=()=>$('#confirm-dialog').close();
$$('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
function loadExample(key){
  const ex=examples[key];if(!ex)return;
  stopRun(false);pause();Object.assign(state,{design:ex.design,testbench:ex.testbench,example:key,modified:false,netlist:null,netlistSource:''});
  switchFile('design');updateProject();save();$('#sidebar').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');run();
}
$$('[data-example]').forEach(b=>b.onclick=()=>{const key=b.dataset.example;if(state.modified)confirmReplace('Load this example?','This replaces both editor files. Export your code first if you want to keep your current work.',()=>loadExample(key));else loadExample(key);});

function log(message,error=false){state.log.push(message);$('#console-output').textContent=state.log.join('\n\n');$('#log-indicator').textContent=error?'Check messages':'Updated';if(error){$('#console-details').open=true;$('#log-indicator').style.color='var(--gold)';}}
function status(message,type=''){$('#simulation-status').textContent=message;$('#simulation-status').className='status-text '+type;}
function job(kind,params,onStage=()=>{}){
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./engine-worker.js',import.meta.url),{type:'module'});
    let done=false;const task={worker,cancel:()=>finish(new Error('Run stopped.'))};state.workers.add(task);
    const timer=setTimeout(()=>finish(new Error(kind==='simulate'?'Simulation exceeded 20 seconds. Check for a loop without a delay, or reduce the time limit.':'Circuit generation exceeded 60 seconds. Try a smaller design.')),kind==='simulate'?20000:60000);
    function finish(error,result){if(done)return;done=true;clearTimeout(timer);worker.terminate();state.workers.delete(task);error?reject(error):resolve(result);}
    worker.onmessage=({data})=>{if(data.type==='stage')onStage(data.message);else if(data.type==='error')finish(new Error(data.message));else if(data.type==='result')finish(null,data.result);};
    worker.onerror=e=>finish(new Error(e.message||'Could not load the simulation tools. Refresh and try again.'));
    worker.postMessage({kind,...params});
  });
}
function setBusy(busy){state.busy=busy;$('#run-label').textContent=busy?'Stop run':'Run simulation';$('#run-icon').textContent=busy?'■':'▶';$('#generate-button').disabled=busy;$('#diagram-mode').disabled=busy;}
function stopRun(announce=true){state.generation++;for(const task of [...state.workers])task.cancel();setBusy(false);if(announce){status('Stopped');toast('Run stopped');}}
function clearResults(){
  pause();state.data=null;state.vcd='';state.netlist=null;state.netlistSource='';state.wireValues=[];state.selected.clear();state.cursor=0;state.stale=false;
  $('#download-vcd').disabled=true;$('#download-diagram').disabled=true;
  for(const id of ['play-button','restart-button','previous-button','next-button','timeline'])$('#'+id).disabled=true;
  $('#wave-content').innerHTML='<div class="empty-state wave-empty"><div class="loading-ring"></div><strong>Let’s see what your circuit does.</strong><p>Compiling your code and recording signal changes…</p></div>';
  $('#diagram-content').innerHTML='<div class="empty-state"><div class="loading-ring"></div><strong>Connecting the logic…</strong><p>Generating a circuit from your design.</p></div>';
  resetDiagram();$('#probe-strip').innerHTML='<span class="muted-text">Waiting for results…</span>';$('#signal-count').textContent='0 SIGNALS';$('#current-time').textContent='0 ns';$('#end-time').textContent='—';$('#timeline').value=0;$('#diagram-time').textContent='COMPILING';$('#cell-count').textContent='Synthesized from your code';
}
async function run(){
  if(state.busy){stopRun();return;}
  if(!state.design.trim()){toast('Add a Verilog module in design.v first.');return;}
  const limit=Number($('#time-limit').value);
  if(!Number.isFinite(limit)||limit<1||limit>100000){toast('Use a simulation limit between 1 and 100,000 ns.');$('#time-limit').focus();return;}
  save();clearResults();setBusy(true);state.log=[];$('#console-details').open=false;$('#log-indicator').style.color='';$('#log-indicator').textContent='Running';$('#console-output').textContent='Preparing your design…';status('Compiling…','busy');
  const id=++state.generation,start=performance.now(),params={design:state.design,testbench:state.testbench,language:$('#language').value,limit,mode:$('#diagram-mode').value};
  let simOK=false,diagramOK=false;
  const simulation=job('simulate',params,m=>{if(id===state.generation)status(m+'…','busy');}).then(result=>{
    if(id!==state.generation)return;log('SIMULATION\n'+result.log);
    if(!result.vcd)throw new Error('No waveform was recorded. Add $dumpfile("signal.vcd"); and $dumpvars(0, tb); to your testbench.');
    state.vcd=result.vcd;state.data=parseVCD(result.vcd);simOK=true;chooseDefaultSignals();renderSignalPicker();renderWaveforms();
    for(const key of ['play-button','restart-button','previous-button','next-button','timeline','download-vcd'])$('#'+key).disabled=false;
    $('#timeline').max=state.data.end;$('#timeline').step=Math.max(state.data.end/10000,.000001);$('#end-time').textContent=timeLabel(state.data.end);setCursor(0);mapDiagramSignals();
    status('Simulation complete','');
  }).catch(e=>{
    if(id!==state.generation)return;log('SIMULATION ERROR\n'+e.message,true);$('#wave-content').innerHTML=`<div class="empty-state wave-empty"><span class="empty-icon">!</span><strong>Let’s fix the code.</strong><p>${esc(e.message.split('\n').find(x=>x.trim())||'Open the log for details.')}</p><p>Check the simulation log below for file names and line numbers.</p></div>`;
  });
  const synthesis=job('synthesize',params).then(async result=>{
    if(id!==state.generation)return;state.netlist=result.netlist;state.netlistSource=params.design;await renderDiagram();if(id!==state.generation)return;diagramOK=true;
    log('CIRCUIT\n'+($('#diagram-mode').value==='rtl'?'RTL':'Gate-level')+' diagram generated from design.v.'+(result.log.trim()?'\n'+result.log.trim():''));updateProject();
    if(state.data){chooseDefaultSignals();renderSignalPicker();renderWaveforms();setCursor(state.cursor);}
  }).catch(e=>{
    if(id!==state.generation)return;log('CIRCUIT MESSAGE\n'+e.message,true);$('#diagram-content').innerHTML=`<div class="empty-state"><span class="empty-icon">◇</span><strong>Diagram unavailable for this design.</strong><p>${esc(e.message.split('\n').filter(x=>/error/i.test(x)).slice(-1)[0]||e.message.slice(0,180))}</p><p>Only synthesizable code belongs in design.v. Your waveform simulation runs separately.</p></div>`;
    $('#diagram-time').textContent='SEE SIMULATION LOG';
  });
  await Promise.allSettled([simulation,synthesis]);
  if(id!==state.generation)return;setBusy(false);
  const elapsed=((performance.now()-start)/1000).toFixed(1);
  status(simOK?(diagramOK?`Complete · ${elapsed}s`:'Waveforms ready · see circuit log'):'Check the simulation log',simOK?'':'error');
  $('#log-indicator').textContent=simOK&&diagramOK?'Successful':'Check messages';
  if(simOK)$('#diagram-time').textContent=diagramOK?'LIVE · '+timeLabel(state.cursor):'DIAGRAM UNAVAILABLE';
}

function signalForName(name){
  if(!state.data)return null;
  return state.data.signals.find(s=>s.aliases.some(a=>a.endsWith('.dut.'+name)))||state.data.signals.find(s=>s.name===name)||state.data.signals.find(s=>s.aliases.some(a=>a.endsWith('.'+name)));
}
function chooseDefaultSignals(){
  if(!state.data)return;
  const mod=state.netlist?topModule(state.netlist)?.[1]:null;
  const ports=mod?Object.entries(mod.ports).sort((a,b)=>(a[1].direction==='output')-(b[1].direction==='output')):[];
  let signals=ports.map(([name])=>signalForName(name)).filter(Boolean);
  if(!signals.length){const shortest=Math.min(...state.data.signals.map(s=>s.path.split('.').length));signals=state.data.signals.filter(s=>s.path.split('.').length===shortest&&s.type!=='integer').slice(0,12);}
  if(!signals.length)signals=state.data.signals.slice(0,12);
  state.selected=new Set(signals.map(s=>s.id));
}
function selectedSignals(){return state.data?[...state.selected].map(id=>state.data.signals.find(s=>s.id===id)).filter(Boolean):[];}
function renderSignalPicker(){
  const root=$('#signal-picker');root.replaceChildren();
  for(const sig of state.data?.signals||[]){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=state.selected.has(sig.id);input.onchange=()=>{input.checked?state.selected.add(sig.id):state.selected.delete(sig.id);renderWaveforms();setCursor(state.cursor);};label.append(input,document.createTextNode(sig.path+(sig.width>1?` [${sig.width-1}:0]`:'')));root.append(label);}
}
const palette=['#a0dcb1','#7cb8d2','#c1a2e2','#e3ba7b','#a9d985','#dd98a0','#8ecec0','#bcba8e'];
function renderWaveforms(){
  if(!state.data)return;
  const signals=selectedSignals(),width=Math.max(660,$('#wave-scroll').clientWidth),left=164,right=24,plot=width-left-right,rowH=33,top=31,height=top+Math.max(signals.length,2)*rowH+10,end=state.data.end;
  state.waveWidth=width;$('#signal-count').textContent=signals.length+' SIGNAL'+(signals.length===1?'':'S');
  let parts=[`<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Timing waveform. Use the timeline slider below to inspect signal values."><rect width="${width}" height="${height}" fill="#141d18"/><rect width="${left-8}" height="${height}" fill="#17211b"/><text x="16" y="19" class="wave-axis">SIGNAL</text><text x="132" y="19" text-anchor="end" class="wave-axis">VALUE</text>`];
  for(let i=0;i<=8;i++){const x=left+plot*i/8;parts.push(`<line x1="${x}" y1="29" x2="${x}" y2="${height}" stroke="#2a3a2f" stroke-width=".65" stroke-dasharray="2 5"/><text x="${x}" y="19" text-anchor="${i===8?'end':i===0?'start':'middle'}" class="wave-axis">${esc(timeLabel(end*i/8))}</text>`);}
  signals.forEach((sig,index)=>{
    const y=top+index*rowH,color=palette[index%palette.length],high=y+8,low=y+26,center=y+17;
    parts.push(`<line x1="0" y1="${y+rowH}" x2="${width}" y2="${y+rowH}" stroke="#25352a" stroke-width=".5"/><circle cx="18" cy="${center}" r="2.3" fill="${color}"/><text x="28" y="${center+3}" class="wave-name">${esc(sig.name.length>12?sig.name.slice(0,11)+'…':sig.name)}<title>${esc(sig.path)}</title></text><text id="wave-value-${index}" x="132" y="${center+3}" text-anchor="end" class="wave-value"></text>`);
    const changes=[{time:0,value:valueAt(sig,0)},...sig.changes.filter(c=>c.time>0&&c.time<=end)];
    let previous=null;
    for(let j=0;j<changes.length;j++){
      const c=changes[j],t2=changes[j+1]?.time??end,x1=left+c.time/end*plot,x2=left+t2/end*plot;
      if(x2<=x1)continue;
      const val=c.value,unknown=/x/.test(val),z=/z/.test(val),stroke=unknown?'#d7b276':z?'#8baacb':color;
      if(sig.width===1&&!unknown&&!z){const yy=val==='1'?high:low;
        parts.push(`<path d="M${x1},${previous!==null?previous:yy}V${yy}H${x2}" fill="none" stroke="${stroke}" stroke-width="1.5"/>`);
        if(val==='1')parts.push(`<rect x="${x1}" y="${high}" width="${x2-x1}" height="${low-high}" fill="${color}" opacity=".07"/>`);previous=yy;
      }else{
        const dx=Math.min(3,(x2-x1)/3);parts.push(`<path d="M${x1},${center}L${x1+dx},${high}H${x2-dx}L${x2},${center}L${x2-dx},${low}H${x1+dx}Z" fill="${stroke}" fill-opacity="${unknown?'.13':'.045'}" stroke="${stroke}" stroke-width="1"/>`);
        const label=formatValue(val,state.base);if(x2-x1>label.length*6+7)parts.push(`<text x="${(x1+x2)/2}" y="${center+3}" text-anchor="middle" class="wave-bus-value" fill="${stroke}">${esc(label)}</text>`);previous=null;
      }
    }
  });
  if(!signals.length)parts.push(`<text x="${left+30}" y="64" class="wave-name">Choose signals from the Signals menu.</text>`);
  parts.push(`<g id="wave-cursor" pointer-events="none"><line y1="25" y2="${height}" stroke="#b3f0c4" stroke-width="1"/><path d="M-4,25H4L0,31Z" fill="#b3f0c4"/></g></svg>`);
  $('#wave-content').innerHTML=parts.join('');
  $('#wave-content svg').addEventListener('pointerdown',e=>{const svg=e.currentTarget,r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*width;if(x<left)return;pause();setCursor((x-left)/plot*end);svg.setPointerCapture(e.pointerId);const move=ev=>{const rr=svg.getBoundingClientRect();setCursor((((ev.clientX-rr.left)/rr.width*width)-left)/plot*end);};const up=()=>{svg.removeEventListener('pointermove',move);svg.removeEventListener('pointerup',up);};svg.addEventListener('pointermove',move);svg.addEventListener('pointerup',up);});
  setCursor(state.cursor);
}
function setCursor(time){
  if(!state.data)return;state.cursor=Math.max(0,Math.min(state.data.end,Number(time)||0));
  $('#timeline').value=state.cursor;$('#current-time').textContent=timeLabel(state.cursor);if(state.netlist)$('#diagram-time').textContent=(state.stale?'PREVIOUS RUN · ':'LIVE · ')+timeLabel(state.cursor);
  const x=164+state.cursor/state.data.end*(state.waveWidth-188);$('#wave-cursor')?.setAttribute('transform',`translate(${x},0)`);
  selectedSignals().forEach((sig,i)=>{const el=$('#wave-value-'+i);if(el){const val=valueAt(sig,state.cursor);el.textContent=formatValue(val,state.base);el.style.fill=/[xz]/.test(val)?'#dfbe85':palette[i%palette.length];}});
  $$('[data-probe]').forEach(el=>{const sig=signalForName(el.dataset.probe);const val=sig?valueAt(sig,state.cursor):'x';el.textContent=formatValue(val,state.base);el.classList.toggle('unknown',/[xz]/.test(val));});
  for(const wire of state.wireValues){const values=wire.bits.map(b=>{if(typeof b==='string')return b;const binding=wire.map.get(b);return binding?valueAt(binding.signal,state.cursor).at(-1-binding.index):null;});const c=values.some(x=>x==='x')?'#bd8736':values.some(x=>x==='z')?'#527fa8':values.some(x=>x==='1')?'#29804b':'#869b8c';if(wire.last!==c){wire.element.style.stroke=c;wire.element.style.strokeWidth=values.includes('1')?'2':'1.25';wire.last=c;}}
}
function pause(){state.playing=false;cancelAnimationFrame(state.animation);$('#play-button').textContent='▶';$('#play-button').setAttribute('aria-label','Play waveform animation');}
function play(){
  if(!state.data)return;if(state.playing){pause();return;}if(state.cursor>=state.data.end)setCursor(0);
  state.playing=true;state.lastFrame=performance.now();$('#play-button').textContent='Ⅱ';$('#play-button').setAttribute('aria-label','Pause waveform animation');
  function frame(now){if(!state.playing)return;const dt=Math.min(now-state.lastFrame,100);state.lastFrame=now;let next=state.cursor+dt/12000*state.data.end*Number($('#playback-speed').value);if(next>=state.data.end){if(state.loop)next=0;else{setCursor(state.data.end);pause();return;}}setCursor(next);state.animation=requestAnimationFrame(frame);}
  state.animation=requestAnimationFrame(frame);
}
function step(direction){if(!state.data)return;pause();const transitions=[...new Set([0,state.data.end,...selectedSignals().flatMap(s=>s.changes.map(c=>c.time))])].sort((a,b)=>a-b);setCursor(direction>0?(transitions.find(t=>t>state.cursor+1e-8)??state.data.end):(transitions.reverse().find(t=>t<state.cursor-1e-8)??0));}

async function renderDiagram(){
  if(!window.netlistsvg||!window.ELK)throw new Error('The diagram renderer could not load. Refresh and try again.');
  const [name,module]=topModule(state.netlist);const mod=structuredClone(module);const counts={};
  mod.cells=Object.fromEntries(Object.entries(mod.cells).filter(([,c])=>!c.type.includes('scopeinfo')).map(([,c])=>{const kind=c.type.replace(/^\$_?/,'').replace(/_$/,'').toUpperCase();counts[kind]=(counts[kind]||0)+1;return [kind+' '+counts[kind],c];}));
  if(Object.keys(mod.cells).length>350)throw new Error('This circuit has more than 350 cells. Use RTL view or a smaller module for a readable diagram.');
  const source=state.netlistSource;
  const svg=await window.netlistsvg.render(window.netlistsvg.digitalSkin,{modules:{[name]:mod}});
  if(source!==state.netlistSource)return;
  const parser=new DOMParser(),doc=parser.parseFromString(svg,'image/svg+xml'),root=doc.documentElement;
  if(root.tagName.toLowerCase()!=='svg')throw new Error('Could not render the generated circuit.');
  // Only inert SVG geometry and labels are accepted from the schematic renderer.
  root.querySelectorAll('script,style,foreignObject,iframe,image,a').forEach(x=>x.remove());
  root.querySelectorAll('*').forEach(x=>{for(const a of [...x.attributes])if(/^on/i.test(a.name)||/href$/i.test(a.name))x.removeAttribute(a.name);});
  const width=parseFloat(root.getAttribute('width')),height=parseFloat(root.getAttribute('height'));
  root.setAttribute('viewBox',`0 0 ${width} ${height}`);root.setAttribute('preserveAspectRatio','xMidYMid meet');root.setAttribute('role','img');root.setAttribute('aria-label',name+' synthesized circuit');
  $('#diagram-content').replaceChildren(document.importNode(root,true));resetDiagram();$('#download-diagram').disabled=false;
  $('#cell-count').textContent=Object.keys(mod.cells).length+' cells · '+Object.keys(mod.ports).length+' ports';
  $('#probe-strip').innerHTML=Object.entries(mod.ports).map(([n,p])=>`<span class="probe ${p.direction==='output'?'output':''}" title="${esc(p.direction)} · ${p.bits.length} bit${p.bits.length===1?'':'s'}">${esc(n)}<b data-probe="${esc(n)}">—</b></span>`).join('');
  mapDiagramSignals();if(state.data)setCursor(state.cursor);
}
function mapDiagramSignals(){
  state.wireValues=[];if(!state.netlist||!state.data)return;
  const mod=topModule(state.netlist)?.[1];if(!mod)return;const map=new Map();
  for(const [name,net]of Object.entries({...mod.netnames,...mod.ports})){const signal=signalForName(name);if(signal)net.bits.forEach((bit,index)=>{if(typeof bit==='number')map.set(bit,{signal,index});});}
  $$('#diagram-content line[class*="net_"], #diagram-content path[class*="net_"], #diagram-content circle[class*="net_"]').forEach(element=>{const cls=[...element.classList].find(c=>c.startsWith('net_'));if(!cls)return;const bits=cls.slice(4).split(',').map(x=>/^\d+$/.test(x)?Number(x):x);state.wireValues.push({element,bits,map,last:null});});
}
function resetDiagram(){state.zoom=1;state.panX=0;state.panY=0;applyDiagramTransform();}
function applyDiagramTransform(){$('#diagram-content').style.transform=`translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;$('#zoom-label').textContent=state.zoom===1?'Fit':Math.round(state.zoom*100)+'%';}
function zoomBy(ratio){state.zoom=Math.max(.4,Math.min(4,state.zoom*ratio));applyDiagramTransform();}
$('#diagram-content').addEventListener('pointerdown',e=>{if(!state.netlist||!$('#diagram-content svg'))return;const el=e.currentTarget,startX=e.clientX-state.panX,startY=e.clientY-state.panY;el.setPointerCapture(e.pointerId);const move=ev=>{state.panX=ev.clientX-startX;state.panY=ev.clientY-startY;applyDiagramTransform();};const up=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);};el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);});
$('#diagram-stage').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoomBy(e.deltaY<0?1.12:1/1.12);}},{passive:false});
$('#diagram-stage').addEventListener('dblclick',resetDiagram);$('#fit-diagram').onclick=resetDiagram;$('#zoom-in').onclick=()=>zoomBy(1.2);$('#zoom-out').onclick=()=>zoomBy(1/1.2);

async function generateTestbench(){
  const action=async()=>{
    if(!state.design.trim()){toast('Write a module first.');return;}
    const id=++state.generation;setBusy(true);status('Reading module ports…','busy');
    try{let netlist=state.netlistSource===state.design?state.netlist:null;if(!netlist){const result=await job('synthesize',{design:state.design,language:$('#language').value,mode:'rtl'});netlist=result.netlist;}if(id!==state.generation)return;state.testbench=createTestbench(netlist);setBusy(false);markStale();switchFile('testbench');save();toast('Testbench created. Review the input sequence, then run.');}
    catch(e){if(id===state.generation){log('TESTBENCH GENERATOR\n'+e.message,true);status('Could not generate testbench','error');toast('See the log for details.');}}
    finally{if(id===state.generation)setBusy(false);}
  };
  if(state.testbench.trim())confirmReplace('Generate a new testbench?','This replaces testbench.v with starter input patterns for the current module. Your design.v file is kept.',action);else action();
}
function download(name,data,type='text/plain'){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$('#export-button').onclick=()=>{download('signal-project.v',state.design+'\n\n// ---------- TESTBENCH ----------\n'+state.testbench);toast('Exported both files as signal-project.v');};
$('#download-vcd').onclick=()=>state.vcd&&download('signal-waveforms.vcd',state.vcd);
$('#download-diagram').onclick=()=>{const svg=$('#diagram-content svg');if(!svg)return;const copy=svg.cloneNode(true);copy.style.background='#e7efe8';const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent='svg{stroke:#56755d;fill:none}text{font-family:monospace;fill:#294633;stroke:none;font-size:10px}.nodelabel{text-anchor:middle}.inputPortLabel{text-anchor:end}.splitjoinBody{fill:#56755d}g[id^="cell_"]>rect{fill:#f1f7f2;stroke:#56755d}';copy.prepend(style);download('signal-circuit.svg',new XMLSerializer().serializeToString(copy),'image/svg+xml');};
$('#upload-button').onclick=()=>$('#file-input').click();
$('#file-input').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>512000){toast('Please import a file smaller than 500 KB.');e.target.value='';return;}const source=cleanSource(await file.text());const fileTab=state.file;const apply=()=>{if(source.includes('// ---------- TESTBENCH ----------')){[state.design,state.testbench]=source.split('// ---------- TESTBENCH ----------');}else state[fileTab]=source;switchFile(fileTab);markStale();save();toast('Imported '+file.name);};confirmReplace('Import into '+(source.includes('// ---------- TESTBENCH ----------')?'both files':fileTab+'.v')+'?','The imported file replaces the current editor content. Export first if you want to keep your work.',apply);e.target.value='';};

$('#run-button').onclick=run;$('#generate-button').onclick=generateTestbench;$('#language').onchange=markStale;$('#time-limit').onchange=save;
$('#diagram-mode').onchange=()=>run();$('#play-button').onclick=play;$('#restart-button').onclick=()=>{pause();setCursor(0);};$('#next-button').onclick=()=>step(1);$('#previous-button').onclick=()=>step(-1);$('#timeline').oninput=e=>{pause();setCursor(e.target.value);};
$('#radix').onchange=e=>{state.base=e.target.value;renderWaveforms();setCursor(state.cursor);};
$('#loop-button').onclick=()=>{state.loop=!state.loop;$('#loop-button').setAttribute('aria-pressed',String(state.loop));};
$('#signals-button').onclick=()=>{const hidden=$('#signal-picker').hidden;$('#signal-picker').hidden=!hidden;$('#signals-button').setAttribute('aria-expanded',String(hidden));if(!state.data)toast('Run a simulation to choose signals.');};
document.addEventListener('click',e=>{if(!e.target.closest('.signal-picker-wrap')){$('#signal-picker').hidden=true;$('#signals-button').setAttribute('aria-expanded','false');}if(window.innerWidth<=640&&$('#sidebar').classList.contains('open')&&!e.target.closest('#sidebar')&&!e.target.closest('#menu-button')){$('#sidebar').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');}});
$('#help-button').onclick=$('#guide-button').onclick=()=>$('#help-dialog').showModal();$('#credits-button').onclick=()=>$('#credits-dialog').showModal();$('#playground-nav').onclick=()=>{window.scrollTo({top:0,behavior:'smooth'});$('#sidebar').classList.remove('open');};
$('#menu-button').onclick=()=>{const open=$('#sidebar').classList.toggle('open');$('#menu-button').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();run();}if(e.key==='Escape'){$('#signal-picker').hidden=true;$('#sidebar').classList.remove('open');}});
let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderWaveforms,150);}).observe($('#wave-scroll'));
window.addEventListener('pagehide',save);

try{const stored=JSON.parse(localStorage.getItem('signal.workspace.v1'));if(stored&&typeof stored.design==='string'&&typeof stored.testbench==='string'){Object.assign(state,{design:stored.design,testbench:stored.testbench,example:stored.example||'full',modified:!!stored.modified});if(stored.limit)$('#time-limit').value=stored.limit;if(['2005','2012'].includes(stored.language))$('#language').value=stored.language;}}catch{}
switchFile('design');updateProject();
// The initial example is compiled live; there are no canned circuit or waveform results.
if(!state.modified)run();
