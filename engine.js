import {cleanSource} from './core.js';

export async function simulate({design,testbench,limit=1000,language='2012'},stage=()=>{},options={}){
  stage('Loading simulator');
  const [{default:makePP},{default:makeIVL},{default:makeVVP}]=await Promise.all([import('./vendor/ivlpp.js'),import('./vendor/ivl.js'),import('./vendor/vvp.js')]);
  const config=options.moduleOptions||{};
  const stdout=[],diagnostics=[],source=[];
  stage('Compiling Verilog');
  const pp=await makePP({...config,print:x=>source.push(x),printErr:x=>diagnostics.push(x)});
  const d=cleanSource(design),tb=cleanSource(testbench);
  const guard='`timescale 1ns/1ps\nmodule __signal_time_limit; initial begin #'+Math.max(1,Math.min(100000,Number(limit)||1000))+'; $display("[Signal] Simulation time limit reached."); $finish; end endmodule\n';
  const trace=/\$dumpvars\s*\(/.test(d+'\n'+tb)?'':'\nmodule __signal_trace; initial begin $dumpfile("signal.vcd"); $dumpvars(0); end endmodule\n';
  pp.FS.writeFile('/design.v',d+'\n'); pp.FS.writeFile('/testbench.v',tb+'\n');pp.FS.writeFile('/guard.v',guard+trace);
  const ppResult=pp.callMain(['-L','/design.v','/testbench.v','/guard.v']);
  if(ppResult)throw new Error(diagnostics.join('\n')||'Preprocessing failed.');
  const ivl=await makeIVL({...config,print:x=>stdout.push(x),printErr:x=>diagnostics.push(x)});
  ivl.FS.writeFile('/ivl.conf',`basedir:/\nmodule:system.vpi\ngeneration:${language}\ngeneration:no-specify\nout:/out.vvp\niwidth:32\nwidthcap:65536\nfunctor:cprop\nfunctor:nodangle\nflag:DLL=vvp.tgt\n`);
  ivl.FS.writeFile('/src.v',source.join('\n')+'\n');
  const result=ivl.callMain(['-C/ivl.conf','--','/src.v']);
  const diagnostic=diagnostics.filter(x=>!/system\.vpi|dynamic linking not enabled/.test(x)).join('\n');
  let compiled;
  try{compiled=ivl.FS.readFile('/out.vvp');}catch{throw new Error(diagnostic||'Compilation failed. Check the module names and syntax.');}
  if(result)throw new Error(diagnostic||'The Verilog compiler reported an error.');
  stage('Simulating');
  const vvp=await makeVVP({...config,print:x=>stdout.push(x),printErr:x=>stdout.push(x)});
  vvp.FS.writeFile('/simulation.vvp',compiled);
  const exitCode=vvp.callMain(['/simulation.vvp']);
  if(exitCode)throw new Error(stdout.join('\n')||'Simulation failed.');
  const names=vvp.FS.readdir('/').filter(n=>n.endsWith('.vcd'));
  let vcd='';
  for(const name of names){const content=vvp.FS.readFile('/'+name,{encoding:'utf8'});if(content.length>vcd.length)vcd=content;}
  if(vcd.length>12*1024*1024)throw new Error('This waveform is too large to display. Reduce the simulation time or the number of dumped signals.');
  return {vcd,log:[diagnostic,...stdout].filter(Boolean).join('\n')};
}

export async function synthesize({design,language='2012',mode='rtl'},stage=()=>{}){
  stage('Loading circuit tools');
  const {runYosys}=await import('./vendor/yosys/bundle.js');
  let log='';const decode=x=>typeof x==='string'?x:new TextDecoder().decode(x);
  stage('Building circuit diagram');
  const script=mode==='gates'?'synth -auto-top -flatten; delete t:$scopeinfo; opt_clean; write_json circuit.json':'prep -auto-top -flatten; delete t:$scopeinfo; write_json circuit.json';
  try{
    const result=await runYosys(['-Q','-q','-p',`read_verilog ${language==='2005'?'':'-sv '}design.v; ${script}`],{'design.v':new TextEncoder().encode(cleanSource(design))},{stdout:x=>{log+=decode(x);},stderr:x=>{log+=decode(x);}});
    if(!result['circuit.json'])throw new Error('No circuit netlist was produced.');
    return {netlist:JSON.parse(decode(result['circuit.json'])),log};
  }catch(e){throw new Error(log.trim()||e.message||'Unable to synthesize this design.');}
}
