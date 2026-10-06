import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import {labPrograms,labCollectionText} from '../lab-programs.js';
import {simulate,synthesize} from '../engine.js';
import {parseVCD} from '../core.js';

if(process.argv[2]) {
  const p=labPrograms.find(p=>p.id===process.argv[2]);assert(p);
  const result=await simulate({...p,limit:1000});
  assert(result.log.includes(`PASS: ${p.id}`),result.log);
  assert(!/time limit reached|FATAL/i.test(result.log),result.log);
  assert(parseVCD(result.vcd).signals.length>0);
  const circuit=await synthesize(p);
  assert(Object.keys(circuit.netlist.modules).length>0);
  console.log(`PASS ${p.id}: self-checking simulation + synthesis`);
} else {
  assert.equal(labPrograms.length,71);
  assert.equal(new Set(labPrograms.map(p=>p.id)).size,71);
  assert.deepEqual(Array.from({length:10},(_,i)=>labPrograms.filter(p=>p.lab===i+1).length),[10,7,8,9,7,7,6,4,7,6]);
  assert.equal(fs.readFileSync(new URL('../all-lab-programs.md',import.meta.url),'utf8').trimEnd(),labCollectionText().trimEnd());
  let failed=0;
  for(const p of labPrograms){
    const r=spawnSync(process.execPath,[fileURLToPath(import.meta.url),p.id],{encoding:'utf8',timeout:60000,maxBuffer:3*1024*1024});
    if(r.status!==0){failed++;console.error('FAIL',p.id,r.stdout,r.stderr,r.error?.message||'');}
    else process.stdout.write(r.stdout);
  }
  console.log(`${labPrograms.length-failed}/${labPrograms.length} passed`);
  if(failed)process.exitCode=1;
}
