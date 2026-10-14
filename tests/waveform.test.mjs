import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulate,synthesize} from '../engine.js';
import {parseVCD,valueAt,timeLabel,createTestbench,withoutComments} from '../core.js';

test('waveform timescale, aliases, unknowns and cursor at transition',()=>{
  const v=parseVCD(`$timescale 10 ps $end
$scope module tb $end
$var wire 1 ! y $end
$scope module dut $end
$var wire 1 ! out $end
$upscope $end
$var wire 4 " bus [3:0] $end
$upscope $end
$enddefinitions $end
#0
x!
bx "
#5
1!
b10 "
#100
0!
bz "
`);
  assert.equal(v.end,1);assert.equal(v.signals.length,2);assert.equal(v.signals[0].aliases.length,2);
  assert.equal(valueAt(v.signals[0],.049),'x');assert.equal(valueAt(v.signals[0],.05),'1');
  assert.equal(valueAt(v.signals[1],.1),'0010');assert.equal(valueAt(v.signals[1],1),'zzzz');
  assert.equal(timeLabel(.000001),'1 fs');assert.equal(timeLabel(.001),'1 ps');
});
test('commented-out dumpvars still produces real waveforms',async()=>{
  assert(!withoutComments('// $dumpvars(0);').includes('$dumpvars'));
  const result=await simulate({design:'`timescale 1ns/1ps\nmodule main(input a, output y); assign y=~a; endmodule',testbench:'`timescale 1ns/1ps\nmodule tb; reg a=0; wire y; main dut(a,y); // $dumpvars(0,tb);\n initial begin #10; a=1; #10; $finish; end endmodule'});
  const v=parseVCD(result.vcd);assert.equal(v.end,20);
  const a=v.signals.find(s=>s.name==='a');assert(a);assert.equal(valueAt(a,9),'0');assert.equal(valueAt(a,10),'1');
});
test('$stop finishes non-interactively with a readable waveform',async()=>{
  const result=await simulate({design:'module main; endmodule',testbench:'`timescale 1ns/1ps\nmodule tb; reg a=0; initial begin #5 a=1; #5 $stop; end endmodule'});
  assert.equal(parseVCD(result.vcd).end,10);
});
test('generated stimulus exercises high bits and both comparator outcomes',async()=>{
  const design='module compare3(input [2:0] a,b, output g,e,l); assign g=a>b; assign e=a==b; assign l=a<b; endmodule';
  const {netlist}=await synthesize({design});
  const testbench=createTestbench(netlist);
  const v=parseVCD((await simulate({design,testbench})).vcd);
  for(const name of ['g','e','l'])assert(v.signals.find(s=>s.name===name).changes.some(c=>c.value==='1'),name);
  for(const name of ['a','b'])assert(v.signals.find(s=>s.name===name).changes.some(c=>c.value==='111'),name);
  const wide=createTestbench({modules:{wide:{ports:{data:{direction:'input',bits:Array.from({length:40},(_,i)=>i)},y:{direction:'output',bits:[50]}}}}});
  assert(wide.includes("40'b"+'1'.repeat(40)));assert(!wide.includes(' = i;'));
});
