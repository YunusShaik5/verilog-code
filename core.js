export const escapeHTML = (s) => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const cleanSource = (s) => s.replace(/[\u00a0\u2000-\u200a\u202f]/g,' ').replace(/[\u200b-\u200d\ufeff]/g,'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"');

export function parseVCD(text) {
  const cut=text.indexOf('$enddefinitions');
  if(cut<0) throw new Error('The simulator did not produce a valid VCD waveform.');
  const header=text.slice(0,cut), body=text.slice(text.indexOf('$end',cut+'$enddefinitions'.length)+4);
  const scale=header.match(/\$timescale\s+(\d+)\s*(s|ms|us|ns|ps|fs)\s+\$end/);
  const nsFactors={s:1e9,ms:1e6,us:1e3,ns:1,ps:.001,fs:.000001};
  const factor=scale?Number(scale[1])*nsFactors[scale[2]]:1;
  const scopes=[],signals=[],byId=new Map();
  for(const match of header.matchAll(/\$(scope|upscope|var)\s+([\s\S]*?)\$end/g)){
    const t=match[2].trim().split(/\s+/);
    if(match[1]==='scope') scopes.push(t[1]);
    else if(match[1]==='upscope') scopes.pop();
    else {
      const [type,width,id,name,...range]=t;
      const path=[...scopes,name].join('.');
      if(scopes.some(x=>x.startsWith('__signal_'))) continue;
      let signal=byId.get(id);
      if(!signal){signal={id,type,width:Number(width),name,path,aliases:[],range:range.join(''),changes:[]};byId.set(id,signal);signals.push(signal);}
      signal.aliases.push(path);
      if(path.split('.').length<signal.path.split('.').length){signal.path=path;signal.name=name;}
    }
  }
  let time=0,end=0;
  for(const line of body.split(/\r?\n/)){
    const s=line.trim();
    if(s[0]==='#'){time=Number(s.slice(1))*factor;end=Math.max(end,time);continue;}
    let id,value;
    if(/^[01xz]/i.test(s)){value=s[0].toLowerCase();id=s.slice(1).trim();}
    else if(/^[bBrR]/.test(s)){const p=s.slice(1).trim().split(/\s+/);value=p[0].toLowerCase();id=p[1];}
    if(!id||!byId.has(id))continue;
    const sig=byId.get(id);
    if(sig.type!=='real')value=value.padStart(sig.width,/[xz]/.test(value[0])?value[0]:'0');
    const changes=sig.changes;
    if(changes.length && changes.at(-1).time===time) changes.at(-1).value=value;
    else if(!changes.length||changes.at(-1).value!==value)changes.push({time,value});
  }
  return {signals,end:Math.max(end,.001),timescale:scale?scale[1]+scale[2]:'1ns'};
}
export function valueAt(signal,time){
  let a=0,b=signal.changes.length-1,found=-1;
  while(a<=b){const m=(a+b)>>1;if(signal.changes[m].time<=time+1e-9){found=m;a=m+1;}else b=m-1;}
  return found<0?'x'.repeat(signal.width):signal.changes[found].value;
}
export function formatValue(value,base='bin'){
  if(!value)return 'x';
  if(/[xz]/i.test(value))return value.length>12?(value.split('').every(x=>x===value[0])?value[0].toUpperCase():value.slice(-12)):value.toUpperCase();
  if(base==='bin')return value.length>16?value.slice(0,5)+'…'+value.slice(-8):value;
  try{return BigInt('0b'+value).toString(base==='hex'?16:10).toUpperCase();}catch{return value;}
}
export function timeLabel(ns){
  if(ns===0)return '0 ns';
  if(ns<1)return `${Number((ns*1000).toFixed(3))} ps`;
  if(ns>=1000)return `${Number((ns/1000).toFixed(3))} µs`;
  return `${Number(ns.toFixed(3))} ns`;
}
export function topModule(netlist){
  const entries=Object.entries(netlist.modules||{});
  return entries.find(([,v])=>v.attributes?.top&&parseInt(v.attributes.top,2))||entries[0];
}
export function createTestbench(netlist){
  const top=topModule(netlist);
  if(!top)throw new Error('No module found. Add a module to design.v first.');
  const [name,mod]=top,ports=Object.entries(mod.ports);
  if(!/^[a-zA-Z_]\w*$/.test(name)||ports.some(([p])=>!/^[$a-zA-Z_]\w*$/.test(p)))throw new Error('For escaped module or port names, please write a testbench manually.');
  if(ports.some(([,p])=>p.direction==='inout'))throw new Error('Bidirectional ports need a custom testbench. Use the Testbench tab to define the drivers.');
  const inputs=ports.filter(([,p])=>p.direction==='input');
  const clocks=inputs.filter(([n,p])=>p.bits.length===1&&/^(clk|clock)(_|$)|_clk$|^clk\d*$/i.test(n));
  const resets=inputs.filter(([n,p])=>p.bits.length===1&&/(^|_)(rst|reset|resetn|rstn)(_|$)/i.test(n));
  const data=inputs.filter(x=>!clocks.includes(x)&&!resets.includes(x));
  const low=n=>/(?:_n|n|_b|_bar)$/i.test(n);
  const width=data.reduce((s,[,p])=>s+p.bits.length,0);
  const count=Math.min(32,2**Math.min(width,5));
  const lines=['`timescale 1ns/1ps','module tb;','  // Generated stimulus — edit these values to test your design.'];
  for(const [n,p] of ports)lines.push(`  ${p.direction==='input'?'reg':'wire'} ${p.bits.length>1?`[${p.bits.length-1}:0] `:''}${n}${p.direction==='input'?' = 0':''};`);
  lines.push('  integer i;','',`  ${name} dut (${ports.map(([n])=>`.${n}(${n})`).join(', ')});`,'');
  for(const [n]of clocks)lines.push(`  always #5 ${n} = ~${n};`);
  lines.push('','  initial begin','    $dumpfile("signal.vcd");','    $dumpvars(0, tb);');
  for(const [n]of resets)lines.push(`    ${n} = ${low(n)?0:1};`);
  if(resets.length){lines.push('    #12;');for(const [n]of resets)lines.push(`    ${n} = ${low(n)?1:0};`);}
  else if(clocks.length)lines.push('    #2; // Change data away from the clock edge.');
  if(data.length){
    lines.push(`    // ${width>5?'32 sample vectors; extend this loop for more coverage.':'Sweep every input combination.'}`,`    for (i = 0; i < ${count}; i = i + 1) begin`,`      {${data.map(([n])=>n).join(', ')}} = i;`,'      #10;','    end');
  }else lines.push('    #100;');
  lines.push('    $finish;','  end','endmodule','');
  return lines.join('\n');
}
